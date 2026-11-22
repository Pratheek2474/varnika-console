"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { listOrders } from "@/lib/data";
import { etaText, isActive, orderUi, progressPct, stateLabel } from "@/lib/orders";
import { fallbackBg } from "@/lib/format";
import { ErrorBox, ProductCard, Thumb, useAsync } from "@/components/ui";
import { Ico } from "@/components/Icons";

/** Distinct occasions from the catalog; falls back to categories when none are tagged. */
function useTiles() {
  const { products } = useStore();
  const occ = Array.from(new Set(products.flatMap((p) => p.occasions))).slice(0, 4);
  if (occ.length) {
    return occ.map((o) => ({
      label: o,
      href: `/explore?occ=${encodeURIComponent(o)}`,
      sample: products.find((p) => p.occasions.includes(o)),
    }));
  }
  const cats = Array.from(new Set(products.map((p) => p.category).filter(Boolean))).slice(0, 4);
  return cats.map((c) => ({
    label: c,
    href: `/explore?cat=${encodeURIComponent(c)}`,
    sample: products.find((p) => p.category === c),
  }));
}

export default function Home() {
  const { products, productsLoading, productsError, reloadProducts, customer } = useStore();
  const orders = useAsync(() => (customer ? listOrders(customer.id) : Promise.resolve([])), [customer?.id]);
  const tiles = useTiles();

  const active = (orders.data ?? []).filter(isActive);
  const o = active.find((x) => orderUi(x) === "progress") ?? active[0];
  const best = [...products].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 8);

  return (
    <>
      <Link href="/search" className="search-btn">
        <Ico n="search" sm />
        <span>Search blouses, sarees, fabrics</span>
      </Link>

      {o && (
        <Link href={`/orders/${o.id}`} className={`update s-${orderUi(o)}`}>
          <Thumb src={o.order_photos?.[0]?.url} />
          <div>
            <small>
              <i />
              Your order · {stateLabel(o)}
            </small>
            <b>{o.item_summary}</b>
            <span className="eta">
              {orderUi(o) === "progress" ? etaText(o) : orderUi(o) === "hold" ? "Tap to see why" : "Tap for details"}
            </span>
            <span className="bar">
              <span style={{ width: `${progressPct(o)}%` }} />
            </span>
          </div>
          <Ico n="right" sm />
        </Link>
      )}

      {productsError && <ErrorBox message={productsError} retry={reloadProducts} />}

      <div className="sec">
        <h3>Bestsellers</h3>
        <Link href="/explore">See all</Link>
      </div>
      {productsLoading ? (
        <div className="hscroll">
          {[0, 1, 2].map((i) => (
            <div key={i} className="pwrap">
              <div className="skeleton" style={{ aspectRatio: "3/4", borderRadius: 40 }} />
            </div>
          ))}
        </div>
      ) : best.length ? (
        <div className="hscroll">
          {best.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        !productsError && (
          <div className="empty" style={{ paddingTop: 10 }}>
            <p>New styles are on their way.</p>
          </div>
        )
      )}

      {tiles.length > 1 && (
        <>
          <div className="sec">
            <h3>Shop by occasion</h3>
          </div>
          <div className="occ">
            {tiles.map((t) => {
              const src = t.sample?.images?.[0] || t.sample?.image_url;
              return (
                <Link key={t.label} href={t.href}>
                  <span className="img pimg" style={src ? undefined : { background: fallbackBg(t.label) }}>
                    {src && <img src={src} alt="" loading="lazy" />}
                  </span>
                  <b>{t.label}</b>
                </Link>
              );
            })}
          </div>
        </>
      )}

      <div className="made">
        <img src="/art/artisan.png" alt="" />
        <p>Made by hand in Hyderabad</p>
        <span>Varnika Boutique by Sujatha Panjam</span>
      </div>
    </>
  );
}
