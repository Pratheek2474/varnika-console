"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { listMeasurements, saveMeasurement } from "@/lib/data";
import { MEASURE_FIELDS, type MeasureKey } from "@/lib/config";
import { Action } from "@/components/Shell";
import { Ico } from "@/components/Icons";
import { Loading, SignInPrompt, Title, useAsync } from "@/components/ui";

function Edit() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const next = params.get("next");
  const { customer, ready, setCustomer, toast } = useStore();
  const sets = useAsync(() => (customer ? listMeasurements(customer) : Promise.resolve([])), [customer?.id]);
  const [label, setLabel] = useState("Blouse");
  const [vals, setVals] = useState<Partial<Record<MeasureKey, string>>>({});
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const m = (sets.data ?? []).find((x) => x.id === id);
    if (!m) return;
    setLabel(m.label || "Blouse");
    const v: Partial<Record<MeasureKey, string>> = {};
    for (const f of MEASURE_FIELDS) v[f.key] = Number(m[f.key]) ? String(Number(m[f.key])) : "";
    setVals(v);
  }, [sets.data, id]);

  if (!ready || sets.loading) return <Loading rows={2} />;
  if (!customer) return <SignInPrompt what="your measurements" next="/measurements" />;

  const save = async () => {
    const nums: Partial<Record<MeasureKey, number>> = {};
    for (const f of MEASURE_FIELDS) nums[f.key] = Number(vals[f.key]) || 0;
    if (!label.trim() || !nums.chest || !nums.waist) {
      setErr("Add a name, bust and waist at least. You can fill the rest later.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await saveMeasurement(customer, id, label.trim(), nums);
      // the first saved set becomes the primary one the boutique sees
      if (!customer.measurement_id) {
        const fresh = await listMeasurements(customer);
        if (fresh[0]) setCustomer({ ...customer, measurement_id: fresh[fresh.length - 1].id });
      }
      toast("Measurements saved");
      router.replace(next ?? "/measurements");
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <>
      <Title t={id ? "Edit measurements" : "New measurements"} sub="All in inches" />
      <div className="note">
        <Ico n="tape" />
        <span>Measure over a well-fitted blouse, with the tape snug but not tight.</span>
      </div>
      <div className="form pad" style={{ paddingTop: 14 }}>
        <label className="field">
          <span>Name this set</span>
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} />
        </label>
        <div className="two">
          {MEASURE_FIELDS.map((f) => (
            <label className="field" key={f.key}>
              <span>{f.label}</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="in"
                value={vals[f.key] ?? ""}
                onChange={(e) => setVals({ ...vals, [f.key]: e.target.value.replace(/[^0-9.]/g, "") })}
              />
              <em>{f.hint}</em>
            </label>
          ))}
        </div>
        {err && <p className="err">{err}</p>}
      </div>
      <Action>
        <button type="button" className="btn primary" disabled={busy} onClick={save}>
          {busy ? "Saving…" : "Save measurements"}
        </button>
      </Action>
    </>
  );
}

export default function EditPage() {
  return (
    <Suspense>
      <Edit />
    </Suspense>
  );
}
