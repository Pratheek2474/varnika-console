"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { listMeasurements } from "@/lib/data";
import { MEASURE_FIELDS } from "@/lib/config";
import { shortDate } from "@/lib/format";
import { Ico } from "@/components/Icons";
import { ErrorBox, Loading, SignInPrompt, Title, useAsync } from "@/components/ui";

export default function Measurements() {
  const { customer, ready } = useStore();
  const q = useAsync(() => (customer ? listMeasurements(customer) : Promise.resolve([])), [customer?.id]);

  if (!ready) return <Loading rows={2} />;
  if (!customer)
    return (
      <>
        <Title t="My measurements" />
        <SignInPrompt what="your measurements" next="/measurements" />
      </>
    );
  const sets = q.data ?? [];

  return (
    <>
      <Title t="My measurements" />
      {q.error && <ErrorBox message={q.error} retry={q.reload} />}
      {q.loading ? (
        <Loading rows={2} />
      ) : sets.length ? (
        sets.map((m) => (
          <div className="mcard" key={m.id}>
            <div className="mhead">
              <div>
                <b>{m.label || "My measurements"}</b>
                <span>Saved {shortDate(m.updated_at)} · inches</span>
              </div>
              <Link className="link" href={`/measurements/edit?id=${m.id}`}>
                Edit
              </Link>
            </div>
            <div className="mgrid">
              {MEASURE_FIELDS.map((f) => (
                <div key={f.key}>
                  <span>{f.label}</span>
                  <b className="tab">{Number(m[f.key]) ? Number(m[f.key]) : "—"}</b>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="empty" style={{ paddingTop: 20 }}>
          <img src="/art/arch.png" alt="" style={{ width: 80 }} />
          <h3>No measurements yet</h3>
          <p>Add them once and we use them for every stitched order.</p>
        </div>
      )}
      <div className="rowgroup">
        <Link className="rowlink" href="/measurements/edit">
          <Ico n="tape" />
          <span>Add a new set of measurements</span>
          <Ico n="right" sm />
        </Link>
        <Link className="rowlink" href="/visit">
          <Ico n="pin" />
          <span>Prefer to be measured? Book a store visit</span>
          <Ico n="right" sm />
        </Link>
      </div>
    </>
  );
}
