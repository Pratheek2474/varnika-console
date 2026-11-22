"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { latestVisit, listMeasurements, placeCustomRequest } from "@/lib/data";
import { longDate } from "@/lib/format";
import { Action } from "@/components/Shell";
import { Ico } from "@/components/Icons";
import { ErrorBox, Steps3, Title, useAsync } from "@/components/ui";

export default function StitchDesign() {
  const router = useRouter();
  const { draft, setDraft, resetDraft, customer, ready, requireAuth, toast } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const sets = useAsync(() => (customer ? listMeasurements(customer) : Promise.resolve([])), [customer?.id]);
  const visit = useAsync(() => (customer ? latestVisit(customer.id) : Promise.resolve(null)), [customer?.id]);

  useEffect(() => {
    if (ready && !customer) requireAuth("/stitch");
  }, [ready, customer, requireAuth]);

  useEffect(() => {
    const urls = draft.photos.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [draft.photos]);

  const measureText =
    draft.measure === "visit"
      ? visit.data
        ? `Store visit · ${longDate(visit.data.visit_on)}, ${visit.data.slot}`
        : "Store visit"
      : (sets.data ?? []).length
      ? `Saved · ${(sets.data ?? [])[0].label || "My measurements"}`
      : "To be added";

  const send = async () => {
    if (!customer || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const o = await placeCustomRequest(customer, {
        garment: draft.garment,
        measure: measureText,
        fabric: draft.fabric === "mine" ? "Customer sends own fabric" : "From Varnika",
        lining: draft.lining,
        neck: draft.neck,
        sleeve: draft.sleeve,
        notes: draft.notes.trim(),
        photos: draft.photos,
      });
      resetDraft();
      router.replace(`/stitch/done?o=${o.id}`);
    } catch (e) {
      setErr((e as Error).message);
      toast("Could not send the request");
      setBusy(false);
    }
  };

  return (
    <>
      <Title t="Design" />
      <Steps3 n={2} labels={["Measure", "Fabric", "Design"]} />
      <button type="button" className={`upload ${draft.photos.length ? "has" : ""}`} onClick={() => fileRef.current?.click()}>
        <Ico n="share" />
        <div>
          <b>{draft.photos.length ? `${draft.photos.length} photo${draft.photos.length > 1 ? "s" : ""} added` : "Add reference photos"}</b>
          <span>{draft.photos.length ? "Tap to add more" : "A design you like, a sketch, or the saree it goes with"}</span>
        </div>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) setDraft({ photos: [...draft.photos, ...files].slice(0, 8) });
          e.target.value = "";
        }}
      />
      {previews.length > 0 && (
        <div className="photoprev" style={{ padding: "0 16px" }}>
          {previews.map((u, i) => (
            <div key={u}>
              <img src={u} alt="" />
              <button type="button" aria-label="Remove photo" onClick={() => setDraft({ photos: draft.photos.filter((_, j) => j !== i) })}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="sec" style={{ paddingTop: 16 }}>
        <h3 style={{ fontSize: 19 }}>Neck</h3>
      </div>
      <div className="chips" style={{ flexWrap: "wrap" }}>
        {["As per photo", "Round", "Boat", "Sweetheart", "High neck"].map((g) => (
          <button key={g} type="button" className={`chip ${draft.neck === g ? "on" : ""}`} onClick={() => setDraft({ neck: g })}>
            {g}
          </button>
        ))}
      </div>
      <div className="sec" style={{ paddingTop: 16 }}>
        <h3 style={{ fontSize: 19 }}>Sleeves</h3>
      </div>
      <div className="chips" style={{ flexWrap: "wrap" }}>
        {["Sleeveless", "Short", "Elbow", "Full"].map((g) => (
          <button key={g} type="button" className={`chip ${draft.sleeve === g ? "on" : ""}`} onClick={() => setDraft({ sleeve: g })}>
            {g}
          </button>
        ))}
      </div>
      <div className="form pad" style={{ paddingTop: 16 }}>
        <label className="field">
          <span>Anything else we should know?</span>
          <textarea rows={3} placeholder="Work details, occasion date, padding…" value={draft.notes} onChange={(e) => setDraft({ notes: e.target.value })} />
        </label>
      </div>
      <div className="bill" style={{ marginTop: 4 }}>
        <h4>Your request</h4>
        <div>
          <span>Garment</span>
          <span>{draft.garment}</span>
        </div>
        <div>
          <span>Measurements</span>
          <span>{measureText}</span>
        </div>
        <div>
          <span>Fabric</span>
          <span>{draft.fabric === "mine" ? "Your own" : "From Varnika"}</span>
        </div>
        <div>
          <span>Neck · sleeves</span>
          <span>
            {draft.neck} · {draft.sleeve}
          </span>
        </div>
      </div>
      <p className="fine">We reply with a price within one working day. The order is confirmed after payment.</p>
      {err && <ErrorBox message={err} />}
      <Action>
        <button type="button" className="btn primary" disabled={busy} onClick={send}>
          {busy ? "Sending…" : "Send request"}
        </button>
      </Action>
    </>
  );
}
