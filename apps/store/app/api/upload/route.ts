import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

const MAX_BYTES = 12 * 1024 * 1024;
const PUBLIC_BASE = "https://pub-c6a6db3b19c848c49de9d1a9271f13e0.r2.dev"; // customerdata bucket

/** Only known customers may upload, and only images. */
async function knownCustomer(id: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !/^[0-9a-f-]{36}$/i.test(id)) return false;
  const res = await fetch(`${url}/rest/v1/customers?select=id&id=eq.${id}`, { headers: { apikey: key } });
  if (!res.ok) return false;
  return ((await res.json()) as unknown[]).length > 0;
}

export async function POST(request: NextRequest) {
  try {
    if (!(await knownCustomer(request.headers.get("x-customer-id") ?? ""))) {
      return NextResponse.json({ error: "Please sign in to add photos." }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get("file") as File | null;
    const prefix = String(form.get("prefix") ?? "uploads").replace(/[^a-zA-Z0-9/_-]/g, "");
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Only photos can be uploaded." }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "That photo is too large (12 MB max)." }, { status: 413 });

    const { env } = getCloudflareContext();
    const r2 = env.CUSTOMERDATA_BUCKET;
    if (!r2) return NextResponse.json({ error: "Photo storage isn't connected." }, { status: 503 });

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${prefix}/${Date.now()}_${safeName}`;
    await r2.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
    return NextResponse.json({ url: `${PUBLIC_BASE}/${key}`, key });
  } catch (e) {
    console.error("upload error", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
