"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { bookVisit, latestVisit } from "@/lib/data";
import { VISIT_SLOTS } from "@/lib/config";
import { longDate } from "@/lib/format";
import { Action } from "@/components/Shell";
import { Ico } from "@/components/Icons";
import { ErrorBox, Loading, SignInPrompt, Title, useAsync } from "@/components/ui";

function Visit() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const { customer, ready, toast } = useStore();
  const [day, setDay] = useState(1);
  const [slot, setSlot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const current = useAsync(() => (customer ? latestVisit(customer.id) : Promise.resolve(null)), [customer?.id]);

  const days = useMemo(() => {
    const out: { iso: string; dow: string; d: number; full: string }[] = [];
    for (let i = 0; i < 6; i++) {
      const x = new Date();
      x.setDate(x.getDate() + i);
      const iso = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
      out.push({
        iso,
        dow: x.toLocaleDateString("en-IN", { weekday: "short" }),
        d: x.getDate(),
        full: x.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
      });
    }
    return out;
  }, []);

  if (!ready) return <Loading rows={2} />;
  if (!customer) return <SignInPrompt what="store visits" next="/visit" />;

  const confirm = async () => {
    if (!slot || busy) return;
    setBusy(true);
    setErr(null);
    try {
      await bookVisit(customer, days[day].iso, slot, days[day].full);
      toast("Store visit booked");
      router.replace(next ?? "/account");
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <>
      <Title t="Book a store visit" sub="We take your measurements at the boutique" />
      <div className="sec" style={{ paddingTop: 8 }}>
        <h3 style={{ fontSize: 19 }}>Pick a day</h3>
      </div>
      <div className="chips">
        {days.map((x, i) => (
          <button key={x.iso} type="button" className={`day ${day === i ? "on" : ""}`} onClick={() => setDay(i)}>
            <span>{x.dow}</span>
            <b className="tab">{x.d}</b>
          </button>
        ))}
      </div>
      <div className="sec" style={{ paddingTop: 18 }}>
        <h3 style={{ fontSize: 19 }}>Pick a time</h3>
      </div>
      <div className="slots">
        {VISIT_SLOTS.map((s) => (
          <button key={s} type="button" className={`chip ${slot === s ? "on" : ""}`} onClick={() => setSlot(s)}>
            {s}
          </button>
        ))}
      </div>
      <div className="note" style={{ marginTop: 18 }}>
        <Ico n="pin" />
        <span>
          <b>Varnika Boutique, Hyderabad</b>
          <br />
          We&apos;ll confirm your slot on chat and share the address and a map link.
        </span>
      </div>
      {current.data && (
        <div className="note">
          <Ico n="check" />
          <span>
            Current booking:{" "}
            <b>
              {longDate(current.data.visit_on)}, {current.data.slot}
            </b>
            . Booking again adds a new request.
          </span>
        </div>
      )}
      {err && <ErrorBox message={err} />}
      <Action>
        <button type="button" className="btn primary" disabled={!slot || busy} onClick={confirm}>
          {busy ? "Booking…" : slot ? "Confirm visit" : "Pick a time to continue"}
        </button>
      </Action>
    </>
  );
}

export default function VisitPage() {
  return (
    <Suspense>
      <Visit />
    </Suspense>
  );
}
