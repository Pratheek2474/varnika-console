"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { latestVisit, listMeasurements } from "@/lib/data";
import { longDate } from "@/lib/format";
import { Action } from "@/components/Shell";
import { Ico, type IconName } from "@/components/Icons";
import { Steps3, Title, useAsync } from "@/components/ui";

const GARMENTS = ["Blouse", "Saree fall & pico", "Lehenga", "Kids frock", "Alteration"];

export default function StitchStart() {
  const router = useRouter();
  const { draft, setDraft, customer, requireAuth } = useStore();
  const sets = useAsync(() => (customer ? listMeasurements(customer) : Promise.resolve([])), [customer?.id]);
  const visit = useAsync(() => (customer ? latestVisit(customer.id) : Promise.resolve(null)), [customer?.id]);

  const first = (sets.data ?? [])[0];
  const opts: [typeof draft.measure, IconName, string, string][] = [
    [
      "saved",
      "tape",
      first ? "Use saved measurements" : "Add my measurements",
      first ? first.label || "My measurements" : "Fill the form once, we keep it",
    ],
    ["form", "needle", "Fill a new measurement form", "5 minutes, with hints for each"],
    ["visit", "pin", "Book a store visit", "We measure you at the boutique"],
  ];

  const next = () => {
    if (!requireAuth("/stitch")) return;
    const m = draft.measure;
    if (m === "form" || (m === "saved" && !first)) router.push("/measurements/edit?next=/stitch/fabric");
    else if (m === "visit" && !visit.data) router.push("/visit?next=/stitch/fabric");
    else router.push("/stitch/fabric");
  };

  return (
    <>
      <Title t="Stitch with us" />
      <Steps3 n={0} labels={["Measure", "Fabric", "Design"]} />
      <div className="stitch-intro">
        <img src="/art/arch.png" alt="" />
        <div>
          <h3>Made to your measurements</h3>
          <span>Tell us what you&apos;d like. We reply with a price, then start once you pay.</span>
        </div>
      </div>
      <div className="sec" style={{ paddingTop: 18 }}>
        <h3 style={{ fontSize: 19 }}>What are we stitching?</h3>
      </div>
      <div className="chips" style={{ flexWrap: "wrap" }}>
        {GARMENTS.map((g) => (
          <button key={g} type="button" className={`chip ${draft.garment === g ? "on" : ""}`} onClick={() => setDraft({ garment: g })}>
            {g}
          </button>
        ))}
      </div>
      <div className="sec" style={{ paddingTop: 18 }}>
        <h3 style={{ fontSize: 19 }}>How should we measure you?</h3>
      </div>
      {opts.map(([k, icon, t, s]) => (
        <button key={k} type="button" className={`option ${draft.measure === k ? "on" : ""}`} onClick={() => setDraft({ measure: k })}>
          <span className="oi">
            <Ico n={icon} />
          </span>
          <div>
            <b>{t}</b>
            <span>{s}</span>
          </div>
          {draft.measure === k && <Ico n="check" />}
        </button>
      ))}
      {visit.data && (
        <div className="note">
          <Ico n="pin" />
          <span>
            Store visit booked:{" "}
            <b>
              {longDate(visit.data.visit_on)}, {visit.data.slot}
            </b>
          </span>
        </div>
      )}
      <p className="fine">
        Already know what you want? <Link href="/chat" style={{ textDecoration: "underline" }}>Chat with us</Link> first.
      </p>
      <Action>
        <button type="button" className="btn primary" onClick={next}>
          Continue
        </button>
      </Action>
    </>
  );
}
