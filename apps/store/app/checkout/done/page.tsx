"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { getOrder, listMeasurements } from "@/lib/data";
import { READY_DAYS, STITCH_DAYS } from "@/lib/config";
import { inr } from "@/lib/format";
import { Ico } from "@/components/Icons";
import { Loading, useAsync } from "@/components/ui";

function Done() {
  const id = useSearchParams().get("o");
  const { customer } = useStore();
  const order = useAsync(() => (customer && id ? getOrder(id, customer.id) : Promise.resolve(null)), [customer?.id, id]);
  const sets = useAsync(() => (customer ? listMeasurements(customer) : Promise.resolve([])), [customer?.id]);

  if (order.loading || sets.loading) return <Loading rows={2} />;
  const o = order.data;
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
  const stitch = o.kind === "stitch";
  const needM = stitch && !(sets.data ?? []).length;

  return (
    <div className="donepage">
      <img src="/art/vine.png" alt="" />
      <span className="tick">
        <Ico n="check" />
      </span>
      <h2>Order placed</h2>
      <p>
        Thank you! Your order number is <b>#{o.order_number}</b>.
      </p>
      <ol className="nextsteps">
        <li className="ok">
          <b>Order received</b>
          <span>{inr(o.total)} to pay</span>
        </li>
        <li className="todo">
          <b>Pay to confirm</b>
          <span>We&apos;ll send payment details on chat</span>
        </li>
        <li className={needM ? "todo" : ""}>
          <b>{needM ? "Send your measurements" : stitch ? "We stitch your order" : "We pack your order"}</b>
          <span>{needM ? "Fill the measurement sheet so we can start" : "You'll see every stage in Orders"}</span>
        </li>
        <li>
          <b>Shipped to you</b>
          <span>In {stitch ? STITCH_DAYS : READY_DAYS}</span>
        </li>
      </ol>
      {needM ? (
        <Link className="btn primary block" href="/measurements/edit">
          Add measurements now
        </Link>
      ) : (
        <Link className="btn primary block" href="/chat">
          Open chat for payment details
        </Link>
      )}
      <Link className="btn ghost block" href={`/orders/${o.id}`}>
        Track this order
      </Link>
      <Link className="btn ghost block" href="/">
        Continue shopping
      </Link>
    </div>
  );
}

export default function DonePage() {
  return (
    <Suspense>
      <Done />
    </Suspense>
  );
}
