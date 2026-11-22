"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { getOrder } from "@/lib/data";
import { etaText, orderUi, progressPct, stateLabel, stepTitle, visibleSteps } from "@/lib/orders";
import { inr, shortDate } from "@/lib/format";
import { Ico } from "@/components/Icons";
import { ErrorBox, Loading, SignInPrompt, Thumb, Title, useAsync } from "@/components/ui";

export default function OrderPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { customer, ready, setChatContext } = useStore();
  const q = useAsync(() => (customer ? getOrder(params.id, customer.id) : Promise.resolve(null)), [customer?.id, params.id]);

  if (!ready) return <Loading rows={2} />;
  if (!customer) return <SignInPrompt what="this order" next={`/orders/${params.id}`} />;
  if (q.loading) return <Loading rows={3} />;
  if (q.error) return <ErrorBox message={q.error} retry={q.reload} />;
  const o = q.data;
  if (!o) {
    return (
      <div className="empty">
        <h3>We couldn&apos;t find that order</h3>
        <Link className="btn primary" href="/orders">
          View orders
        </Link>
      </div>
    );
  }

  const ui = orderUi(o);
  const steps = visibleSteps(o);
  const ask = (about: string) => {
    setChatContext(about);
    router.push("/chat");
  };
  const headline = ui === "hold" ? "On hold" : ui === "delivered" ? "Delivered" : ui === "quote" ? "We're preparing your quote" : etaText(o);
  const sub =
    ui === "hold"
      ? "We'll update the date once it resumes"
      : ui === "delivered"
      ? "Thank you!"
      : ui === "quote"
      ? "Usually within one working day"
      : `${stateLabel(o)} · step ${Math.max(1, steps.findIndex((s) => s.state === "current") + 1)} of ${steps.length}`;
  const holdNote = steps.find((s) => s.title === "Hold Check")?.description;
  const ship = o.shipments?.[0];

  return (
    <>
      <Title t="Your order" sub={`#${o.order_number}`} />
      <div className={`track-head s-${ui}`}>
        <Thumb src={o.order_photos?.[0]?.url} />
        <div>
          <small>{o.item_summary}</small>
          <h2>{headline}</h2>
          <p>{sub}</p>
          {ui !== "delivered" && (
            <div className="progress">
              <i style={{ width: `${progressPct(o)}%` }} />
            </div>
          )}
        </div>
      </div>

      {ui === "hold" && (
        <div className="note warn">
          <Ico n="clock" />
          <span>{holdNote || "We've paused this order for a moment. We'll message you with the reason and the new date."}</span>
        </div>
      )}
      {ui === "quote" && (
        <div className="note">
          <Ico n="chat" />
          <span>We&apos;ll send the price on chat. Your order is confirmed once you pay.</span>
        </div>
      )}
      {ui !== "quote" && !o.is_paid && (
        <div className="note">
          <Ico n="cash" />
          <span>Payment pending. We&apos;ll send the payment details on chat, and your order is confirmed once we receive it.</span>
        </div>
      )}
      {ship && (
        <div className="note">
          <Ico n="box" />
          <span>
            Shipped with{" "}
            <b className="tab">
              {ship.carrier} · {ship.tracking_number}
            </b>
          </span>
        </div>
      )}

      <ol className="steps">
        {steps.map((t) => {
          const s = t.state === "completed" ? "done" : t.state === "current" ? (ui === "hold" ? "hold" : "now") : "next";
          return (
            <li key={t.id} className={s}>
              <i className="node">
                {s === "done" ? <Ico n="check" sm style={{ width: 13, height: 13 }} /> : s === "now" ? <Ico n="needle" sm style={{ width: 13, height: 13 }} /> : s === "hold" ? "!" : ""}
              </i>
              <div>
                <b>{stepTitle(t.title, o)}</b>
                {t.state !== "upcoming" && t.display_time && t.display_time !== "Scheduled" ? <span>{t.display_time}</span> : null}
              </div>
            </li>
          );
        })}
      </ol>

      {o.order_items && o.order_items.length > 0 && (
        <div className="bill tab" style={{ marginTop: 14 }}>
          <h4>Items</h4>
          {o.order_items.map((it, i) => (
            <div key={i}>
              <span>
                {it.name} × {Number(it.qty)}
                <em style={{ display: "block", fontStyle: "normal", fontSize: 11, color: "var(--muted)" }}>{it.detail}</em>
              </span>
              <span>{inr(Number(it.price) * Number(it.qty))}</span>
            </div>
          ))}
        </div>
      )}

      <div className="rowgroup">
        <button className="rowlink" type="button" onClick={() => ask(`order #${o.order_number}`)}>
          <Ico n="chat" />
          <span>Message us about this order</span>
          <Ico n="right" sm />
        </button>
        {ui === "delivered" && (
          <button className="rowlink" type="button" onClick={() => ask(`an alteration for #${o.order_number}`)}>
            <Ico n="scissors" />
            <span>Need an alteration?</span>
            <Ico n="right" sm />
          </button>
        )}
        {o.kind === "stitch" && ui !== "delivered" && (
          <Link className="rowlink" href="/measurements">
            <Ico n="tape" />
            <span>View measurements used</span>
            <Ico n="right" sm />
          </Link>
        )}
      </div>

      <div className="bill tab" style={{ marginTop: 14 }}>
        <div className="total" style={{ border: 0, padding: 0 }}>
          <span>{ui === "quote" ? "Estimated total" : o.is_paid ? "Total paid" : "Total"}</span>
          <span>{ui === "quote" ? "To be quoted" : inr(o.total)}</span>
        </div>
      </div>
      <p className="fine">Placed on {shortDate(o.created_at)}</p>
    </>
  );
}
