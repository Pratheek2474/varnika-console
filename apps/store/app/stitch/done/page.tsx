"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { getOrder } from "@/lib/data";
import { STITCH_DAYS } from "@/lib/config";
import { Ico } from "@/components/Icons";
import { Loading, useAsync } from "@/components/ui";

function Done() {
  const id = useSearchParams().get("o");
  const { customer } = useStore();
  const q = useAsync(() => (customer && id ? getOrder(id, customer.id) : Promise.resolve(null)), [customer?.id, id]);
  if (q.loading) return <Loading rows={2} />;
  const o = q.data;
  if (!o)
    return (
      <div className="empty">
        <h3>We couldn&apos;t find that request</h3>
        <Link className="btn primary" href="/orders">
          View orders
        </Link>
      </div>
    );
  return (
    <div className="donepage">
      <img src="/art/vine.png" alt="" />
      <span className="tick">
        <Ico n="check" />
      </span>
      <h2>Request sent</h2>
      <p>
        Reference <b>#{o.order_number}</b>. We&apos;ll reply on chat with a price within one working day.
      </p>
      <ol className="nextsteps">
        <li className="ok">
          <b>Request received</b>
          <span>{o.item_summary}</span>
        </li>
        <li>
          <b>We send a quote</b>
          <span>On chat and WhatsApp</span>
        </li>
        <li>
          <b>You pay to confirm</b>
          <span>Then we start stitching</span>
        </li>
        <li>
          <b>Shipped to you</b>
          <span>In {STITCH_DAYS}</span>
        </li>
      </ol>
      <Link className="btn primary block" href={`/orders/${o.id}`}>
        View request
      </Link>
      <Link className="btn ghost block" href="/chat">
        Open chat
      </Link>
    </div>
  );
}

export default function StitchDonePage() {
  return (
    <Suspense>
      <Done />
    </Suspense>
  );
}
