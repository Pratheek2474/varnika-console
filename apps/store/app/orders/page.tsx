"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { listOrders } from "@/lib/data";
import { etaText, isActive, orderUi, stateLabel } from "@/lib/orders";
import { inr } from "@/lib/format";
import { Ico } from "@/components/Icons";
import { ErrorBox, Loading, SignInPrompt, Thumb, Title, useAsync } from "@/components/ui";

export default function Orders() {
  const { customer, ready } = useStore();
  const [tab, setTab] = useState<"active" | "done">("active");
  const orders = useAsync(() => (customer ? listOrders(customer.id) : Promise.resolve([])), [customer?.id]);

  if (!ready) return <Loading rows={2} />;
  if (!customer)
    return (
      <>
        <Title t="Orders" />
        <SignInPrompt what="your orders" next="/orders" />
      </>
    );

  const all = orders.data ?? [];
  const act = all.filter(isActive);
  const del = all.filter((o) => !isActive(o));
  const list = tab === "active" ? act : del;

  return (
    <>
      <Title t="Orders" />
      <div className="chips" style={{ paddingBottom: 6 }}>
        <button type="button" className={`chip ${tab === "active" ? "on" : ""}`} onClick={() => setTab("active")}>
          In progress · {act.length}
        </button>
        <button type="button" className={`chip ${tab === "done" ? "on" : ""}`} onClick={() => setTab("done")}>
          Delivered · {del.length}
        </button>
      </div>
      {orders.error && <ErrorBox message={orders.error} retry={orders.reload} />}
      {orders.loading ? (
        <Loading rows={3} />
      ) : list.length ? (
        list.map((o) => {
          const ui = orderUi(o);
          return (
            <Link key={o.id} href={`/orders/${o.id}`} className="ordrow">
              <Thumb src={o.order_photos?.[0]?.url} />
              <div>
                <span className={`pill ${ui === "hold" ? "hold" : ui === "delivered" ? "done" : ui === "quote" ? "quote" : "live"}`}>
                  {stateLabel(o)}
                </span>
                <b>{o.item_summary}</b>
                <span>
                  #{o.order_number} · {ui === "progress" ? etaText(o) : ui === "delivered" ? inr(o.total) : ui === "quote" ? "Quote coming" : "We'll update you"}
                </span>
              </div>
              <Ico n="right" sm />
            </Link>
          );
        })
      ) : (
        <div className="empty" style={{ paddingTop: 30 }}>
          <h3>{tab === "active" ? "No orders in progress" : "No delivered orders yet"}</h3>
          <p>Your orders will appear here.</p>
          <Link className="btn primary" href="/explore">
            Browse styles
          </Link>
        </div>
      )}
    </>
  );
}
