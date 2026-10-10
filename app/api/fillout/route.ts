import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import {
  createMeasurement,
  updateMeasurement,
  type MeasurementInput,
} from "@/lib/supabase/queries-customers";
import { logActivity } from "@/lib/supabase/activity";

export const dynamic = "force-dynamic";

// POST /api/fillout?key=SHARED_SECRET
// Fillout webhook target: paste this URL into Fillout's webhook step.
// Each submission is mapped to a customer (by order no > email > phone > name,
// else a new customer is created) and its answers become blouse measurements.

type Answer = { label: string; value: unknown };

function asText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (Array.isArray(v)) return v.map(asText).join(", ");
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    for (const k of ["url", "value", "text", "label", "name"]) {
      if (typeof o[k] === "string" && o[k]) return o[k] as string;
    }
    try {
      return JSON.stringify(v);
    } catch {
      return "";
    }
  }
  return "";
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const m = asText(v).replace(/["'”incm\s]/gi, "").match(/-?\d+(\.\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0]);
  return Number.isFinite(n) ? n : null;
}

// Fillout payloads vary by form setup; accept every documented shape.
function extractAnswers(body: unknown): Answer[] {
  if (!body || typeof body !== "object") return [];
  const b = body as Record<string, unknown>;
  const out: Answer[] = [];
  const push = (label: unknown, value: unknown) => {
    const l = asText(label).trim();
    if (l) out.push({ label: l, value });
  };

  const arr = b.questions ?? b.answers ?? b.fields ?? b.responses;
  if (Array.isArray(arr)) {
    for (const q of arr) {
      if (q && typeof q === "object") {
        const o = q as Record<string, unknown>;
        push(o.name ?? o.title ?? o.label ?? o.question ?? o.id, o.value ?? o.answer);
      }
    }
  } else if (arr && typeof arr === "object") {
    for (const [k, v] of Object.entries(arr)) push(k, v);
  }
  const data = b.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    for (const [k, v] of Object.entries(data)) push(k, v);
  }
  const params = b.urlParameters ?? b.url_parameters;
  if (Array.isArray(params)) {
    for (const p of params) {
      if (p && typeof p === "object") {
        const o = p as Record<string, unknown>;
        push(o.name ?? o.key, o.value);
      }
    }
  }
  return out;
}

// [measurement field, ...label keywords] — order matters (sleeve before bare "length").
const FIELD_KEYWORDS: [keyof Omit<MeasurementInput, "label">, string[]][] = [
  ["sleeve_length", ["sleeve length"]],
  ["sleeve_round", ["sleeve round", "sleeve width", "arm round"]],
  ["blouse_length", ["blouse length", "kurta length", "top length", "length"]],
  ["shoulder", ["shoulder"]],
  ["chest", ["chest", "bust"]],
  ["waist", ["waist"]],
  ["armhole", ["armhole", "arm hole", "arm-hole"]],
  ["front_neck_deep", ["front neck", "front deep"]],
  ["back_neck_deep", ["back neck", "back deep"]],
];

function mapMeasurements(answers: Answer[]): Partial<MeasurementInput> {
  const mapped: Partial<MeasurementInput> = {};
  const used = new Set<number>();
  for (const [field, keywords] of FIELD_KEYWORDS) {
    for (let i = 0; i < answers.length; i++) {
      if (used.has(i)) continue;
      const label = answers[i].label.toLowerCase();
      if (keywords.some((k) => label.includes(k))) {
        const n = asNumber(answers[i].value);
        if (n != null) {
          mapped[field] = n;
          used.add(i);
          break;
        }
      }
    }
  }
  return mapped;
}

function findAnswer(answers: Answer[], ...keywords: string[]): string {
  for (const a of answers) {
    const label = a.label.toLowerCase();
    if (keywords.some((k) => label.includes(k))) {
      const t = asText(a.value).trim();
      if (t) return t;
    }
  }
  return "";
}

function digits(s: string): string {
  return s.replace(/\D/g, "");
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    usage: "POST Fillout submission JSON here (?key=SHARED_SECRET).",
  });
}

export async function POST(request: NextRequest) {
  const required = process.env.FILLOUT_WEBHOOK_KEY;
  if (required && request.nextUrl.searchParams.get("key") !== required) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const answers = extractAnswers(body);
  if (answers.length === 0) {
    return NextResponse.json({ error: "No answers found in payload" }, { status: 400 });
  }

  const measurements = mapMeasurements(answers);
  const email = findAnswer(answers, "email", "e-mail");
  const phone = findAnswer(answers, "phone", "mobile", "contact number", "contact");
  const orderNo = findAnswer(answers, "order number", "order no", "order id");
  let name = findAnswer(answers, "customer name", "full name", "your name", "name");

  try {
    // 1. Resolve customer: order no > email > phone > name.
    let customerId: string | null = null;
    let customerName = "";
    let measurementId: string | null = null;
    let orderId: string | null = null;

    if (orderNo) {
      const { data: order } = await supabase
        .from("orders")
        .select("id, customer_id")
        .ilike("order_number", orderNo.trim())
        .limit(1)
        .single();
      if (order?.customer_id) {
        customerId = order.customer_id as string;
        orderId = order.id as string;
      }
    }

    if (!customerId && email) {
      const { data: c } = await supabase
        .from("customers")
        .select("id, customer_name, measurement_id")
        .ilike("email", email.trim())
        .limit(1)
        .single();
      if (c) {
        customerId = c.id;
        customerName = c.customer_name;
        measurementId = c.measurement_id;
      }
    }

    if (!customerId && phone) {
      const { data: list } = await supabase
        .from("customers")
        .select("id, customer_name, phone, measurement_id");
      const want = digits(phone);
      const hit = ((list ?? []) as { id: string; customer_name: string; phone: string; measurement_id: string | null }[])
        .find((c) => c.phone && digits(c.phone) && (digits(c.phone).endsWith(want.slice(-10)) || want.endsWith(digits(c.phone).slice(-10))));
      if (hit) {
        customerId = hit.id;
        customerName = hit.customer_name;
        measurementId = hit.measurement_id;
      }
    }

    if (!customerId && name) {
      const { data: c } = await supabase
        .from("customers")
        .select("id, customer_name, measurement_id")
        .ilike("customer_name", name.trim())
        .limit(1)
        .single();
      if (c) {
        customerId = c.id;
        customerName = c.customer_name;
        measurementId = c.measurement_id;
      }
    }

    if (!customerId) {
      if (!name) name = "Fillout submission";
      const { data: c, error } = await supabase
        .from("customers")
        .insert({
          customer_name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
        })
        .select("id, customer_name, measurement_id")
        .single();
      if (error || !c) throw new Error(`Could not create customer: ${error?.message ?? "unknown"}`);
      customerId = c.id;
      customerName = c.customer_name;
      measurementId = c.measurement_id;
    }

    // Latest order for PDF attach + label fallback.
    if (!orderId) {
      const { data: o } = await supabase
        .from("orders")
        .select("id")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (o) orderId = o.id;
    }

    // 2. Merge measurements (keep existing values for fields the form lacks).
    let merged: MeasurementInput = {
      label: `${customerName} — Fillout`,
      blouse_length: 0, shoulder: 0, chest: 0, waist: 0, armhole: 0,
      sleeve_length: 0, sleeve_round: 0, front_neck_deep: 0, back_neck_deep: 0,
    };
    if (measurementId) {
      const { data: m } = await supabase
        .from("measurements")
        .select("*")
        .eq("id", measurementId)
        .single();
      if (m) {
        const r = m as Record<string, number | string>;
        merged = {
          label: (r.label as string) || merged.label,
          blouse_length: Number(r.blouse_length) || 0,
          shoulder: Number(r.shoulder) || 0,
          chest: Number(r.chest) || 0,
          waist: Number(r.waist) || 0,
          armhole: Number(r.armhole) || 0,
          sleeve_length: Number(r.sleeve_length) || 0,
          sleeve_round: Number(r.sleeve_round) || 0,
          front_neck_deep: Number(r.front_neck_deep) || 0,
          back_neck_deep: Number(r.back_neck_deep) || 0,
        };
      }
    }
    Object.assign(merged, measurements);

    if (measurementId) {
      await updateMeasurement(measurementId, merged);
    } else {
      const created = await createMeasurement(merged);
      measurementId = created.id;
      await supabase.from("customers").update({ measurement_id: measurementId }).eq("id", customerId);
    }

    // 3. Attach PDF/file answer to the order when present (best effort).
    try {
      const pdf = answers.find((a) => /\.pdf(\?|$)/i.test(asText(a.value)));
      const pdfUrl = pdf ? asText(pdf.value).trim() : "";
      if (pdfUrl && orderId) {
        await supabase.from("order_documents").insert({
          order_id: orderId,
          name: "Fillout measurements.pdf",
          kind: "measurement_chart",
          size_text: "",
          url: pdfUrl,
        });
      }
    } catch {
      // Never fail the webhook over the PDF attach.
    }

    await logActivity({
      actor: "Fillout",
      action: "added",
      entityType: "customer",
      entityId: customerId,
      entityLabel: customerName,
      detail: "measurements via Fillout form",
      customerId,
      customerName,
      orderId,
      orderNumber: orderNo,
    });

    return NextResponse.json({
      ok: true,
      customer_id: customerId,
      measurement_id: measurementId,
      mapped_fields: Object.keys(measurements),
    });
  } catch (e) {
    console.error("Fillout webhook error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
