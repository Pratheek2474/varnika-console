"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { lineUnit } from "@/lib/data";
import { READY_DAYS, SHIPPING, STITCH_DAYS } from "@/lib/config";
import { inr, offPct } from "@/lib/format";
import { Action } from "@/components/Shell";
import { Loading, Thumb, Title } from "@/components/ui";

function BillRows() {
  const { bagMrp, bagSubtotal, payable } = useStore();
  return (
    <>
      <div>
        <span>Bag total (MRP)</span>
        <span>{inr(bagMrp)}</span>
      </div>
      {bagMrp > bagSubtotal && (
        <div>
          <span>Discount on MRP</span>
          <span className="save">−{inr(bagMrp - bagSubtotal)}</span>
        </div>
      )}
      <div>
        <span>Shipping</span>
        <span>{inr(SHIPPING)}</span>
      </div>
      <div className="total">
        <span>You pay</span>
        <span>{inr(payable)}</span>
      </div>
    </>
  );
}

export default function BagPage() {
  const router = useRouter();
  const { bagLines, bagCount, payable, setQty, toast, productsLoading, requireAuth } = useStore();

  if (productsLoading && !bagLines.length) return <Loading rows={2} />;

  if (!bagLines.length) {
    return (
      <>
        <Title t="Your bag" />
        <div className="empty">
          <img src="/art/artisan.png" alt="" />
          <h3>Your bag is empty</h3>
          <p>Pick a blouse, saree or frock. Choose &quot;Stitch to my size&quot; and we&apos;ll make it for you.</p>
          <Link className="btn primary" href="/explore">
            Browse styles
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Title t="Your bag" sub={`${bagCount} item${bagCount > 1 ? "s" : ""}`} />
      {bagLines.map(({ product: p, line }) => {
        const off = offPct(p);
        return (
          <div className="line" key={p.id}>
            <Link href={`/p/${p.id}`} className="thumb-link" aria-label={p.name}>
              <Thumb product={p} />
            </Link>
            <div className="info">
              <b>{p.name}</b>
              <span>{line.mode === "stitch" ? "Stitched to your measurements" : `Standard size · ${line.size}`}</span>
              <div className="price tab">
                <b>{inr(lineUnit(p, line))}</b>
                {off > 0 && <span className="off">{off}% off</span>}
              </div>
              <div className="row">
                <span>Ships in {line.mode === "stitch" ? STITCH_DAYS : READY_DAYS}</span>
                <div className="stepper">
                  <button
                    type="button"
                    aria-label="Remove one"
                    onClick={() => {
                      setQty(p.id, line.qty - 1);
                      if (line.qty - 1 <= 0) toast("Removed from bag");
                    }}
                  >
                    −
                  </button>
                  <span className="tab">{line.qty}</span>
                  <button type="button" aria-label="Add one" onClick={() => setQty(p.id, line.qty + 1)}>
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div className="bill tab">
        <h4>Price details</h4>
        <BillRows />
      </div>
      <p className="fine">Orders are confirmed once payment is received. Shipping charges apply.</p>

      <Action>
        <div className="sum">
          <small>You pay</small>
          <b className="tab">{inr(payable)}</b>
        </div>
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            if (requireAuth("/checkout")) router.push("/checkout");
          }}
        >
          Checkout
        </button>
      </Action>
    </>
  );
}
