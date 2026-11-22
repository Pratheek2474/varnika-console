"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { listMeasurements } from "@/lib/data";
import { READY_DAYS, SIZE_GUIDE, STITCH_DAYS, STITCH_FEE } from "@/lib/config";
import { inr, offPct, productImages } from "@/lib/format";
import { Action } from "@/components/Shell";
import { Sheet } from "@/components/Sheet";
import { Ico } from "@/components/Icons";
import { Loading, ProductCard, ProductImage, useAsync } from "@/components/ui";

export default function ProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { byId, products, productsLoading, favs, toggleFav, toast, bag, addToBag, customer, setChatContext } = useStore();
  const p = byId(params.id);
  const [mode, setMode] = useState<"stitch" | "ready" | null>(null);
  const [size, setSize] = useState("M");
  const [guide, setGuide] = useState(false);
  const [shot, setShot] = useState(0);

  const sets = useAsync(() => (customer ? listMeasurements(customer) : Promise.resolve([])), [customer?.id]);

  if (!p) {
    return productsLoading ? (
      <Loading rows={4} />
    ) : (
      <div className="empty">
        <h3>We couldn&apos;t find that style</h3>
        <p>It may have been taken down.</p>
        <Link className="btn primary" href="/explore">
          Browse styles
        </Link>
      </div>
    );
  }

  const m = mode ?? (p.category.toLowerCase().startsWith("saree") ? "ready" : "stitch");
  const unit = p.price + (m === "stitch" ? STITCH_FEE : 0);
  const off = offPct(p);
  const imgs = productImages(p);
  const inBag = bag.find((l) => l.productId === p.id)?.qty ?? 0;
  const sold = !p.on_demand && p.stock <= 0;
  const low = !p.on_demand && p.stock > 0 && p.stock <= 5;
  const saved = favs.has(p.id);
  const first = (sets.data ?? [])[0];
  const others = products.filter((x) => x.id !== p.id).slice(0, 4);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: p.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast("Link copied");
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <>
      <div className="pdp-bar">
        <span />
        <div style={{ display: "flex" }}>
          <button className="icon-btn" type="button" onClick={share} aria-label="Share">
            <Ico n="share" />
          </button>
          <button
            className="icon-btn"
            type="button"
            onClick={() => {
              toggleFav(p.id);
              toast(saved ? "Removed from saved" : "Saved");
            }}
            aria-label="Save"
            style={saved ? { color: "var(--wine)" } : undefined}
          >
            <Ico n="heart" style={saved ? { fill: "var(--wine)" } : undefined} />
          </button>
        </div>
      </div>

      <div className="pdp-img">
        {imgs.length > 1 ? (
          <div
            className="gallery"
            onScroll={(e) => {
              const el = e.currentTarget;
              setShot(Math.round(el.scrollLeft / el.clientWidth));
            }}
          >
            {imgs.map((u) => (
              <div key={u}>
                <img src={u} alt={p.name} />
              </div>
            ))}
          </div>
        ) : (
          <ProductImage product={p} />
        )}
        {imgs.length > 1 && (
          <div className="dots">
            {imgs.map((u, i) => (
              <i key={u} className={i === shot ? "on" : ""} />
            ))}
          </div>
        )}
      </div>

      <div className="sheet">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {sold && <span className="badge low">Sold out</span>}
          {p.featured && (
            <span className="badge gold" style={{ background: "var(--gold-soft)" }}>
              Handcrafted
            </span>
          )}
          {low && <span className="badge low">Only {p.stock} left</span>}
          <span className="badge soft">
            {p.category}
            {p.subcategory ? " · " + p.subcategory : ""}
          </span>
        </div>
        <h2>{p.name}</h2>
        {p.material && (
          <div className="sub">
            <span>{p.material}</span>
          </div>
        )}
        <div className="price tab" style={{ gap: 8 }}>
          <b style={{ fontSize: 21 }}>{inr(unit)}</b>
          {off > 0 && (
            <>
              <s style={{ fontSize: 13 }}>{inr(p.mrp + (m === "stitch" ? STITCH_FEE : 0))}</s>
              <span className="off" style={{ fontSize: 13 }}>
                {off}% off
              </span>
            </>
          )}
        </div>
        {p.description && <p className="fine" style={{ margin: "8px 0 0", padding: 0, fontSize: 13 }}>{p.description}</p>}

        <div className="seg" role="radiogroup" aria-label="How you want it">
          <button type="button" role="radio" aria-checked={m === "stitch"} className={m === "stitch" ? "on" : ""} onClick={() => setMode("stitch")}>
            <b>Stitch to my size</b>
            <span>
              +{inr(STITCH_FEE)} · ships in {STITCH_DAYS}
            </span>
          </button>
          <button type="button" role="radio" aria-checked={m === "ready"} className={m === "ready" ? "on" : ""} onClick={() => setMode("ready")}>
            <b>Standard size</b>
            <span>Ships in {READY_DAYS}</span>
          </button>
        </div>

        {m === "stitch" ? (
          first ? (
            <div className="measure">
              <Ico n="tape" />
              <div>
                <b>Saved measurements</b>
                <span>{first.label || "My measurements"}</span>
              </div>
              <Link href="/measurements">Change</Link>
            </div>
          ) : (
            <div className="measure">
              <Ico n="tape" />
              <div>
                <b>We need your measurements</b>
                <span>Add them now, or after you order</span>
              </div>
              <Link href="/measurements/edit">Add</Link>
            </div>
          )
        ) : (
          <div>
            <div className="sizes">
              {["XS", "S", "M", "L", "XL"].map((s) => (
                <button key={s} type="button" className={size === s ? "on" : ""} onClick={() => setSize(s)}>
                  {s}
                </button>
              ))}
            </div>
            <button className="link" type="button" onClick={() => setGuide(true)} style={{ marginTop: 10 }}>
              Size guide
            </button>
          </div>
        )}

        <div className="trust">
          <div>
            <Ico n="scissors" />
            Stitched by our own tailors
          </div>
          <div>
            <Ico n="box" />
            Ships in {STITCH_DAYS}
          </div>
          <div>
            <Ico n="chat" />
            Chat with us any time
          </div>
        </div>
        <div className="kv">
          {p.material && (
            <>
              <span>Fabric</span>
              <b>{p.material}</b>
            </>
          )}
          <span>SKU</span>
          <b className="tab">{p.sku}</b>
          <span>Care</span>
          <b>Dry clean only</b>
        </div>
        <button
          className="rowlink"
          type="button"
          onClick={() => {
            setChatContext(p.name);
            router.push("/chat");
          }}
        >
          <Ico n="chat" />
          <span>Want a change to this design? Ask us</span>
          <Ico n="right" sm />
        </button>
      </div>

      {others.length > 0 && (
        <>
          <div className="sec">
            <h3>You may also like</h3>
          </div>
          <div className="hscroll">
            {others.map((x) => (
              <ProductCard key={x.id} p={x} />
            ))}
          </div>
        </>
      )}

      <Action>
        <div className="sum">
          <small>{m === "stitch" ? "incl. stitching" : "price"}</small>
          <b className="tab">{inr(unit)}</b>
        </div>
        {sold ? (
          <button type="button" className="btn primary" disabled>
            Sold out
          </button>
        ) : inBag ? (
          <Link href="/bag" className="btn outline">
            In bag ({inBag}) · View
          </Link>
        ) : (
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              addToBag(p.id, m, size);
              toast("Added to bag");
            }}
          >
            Add to bag
          </button>
        )}
      </Action>

      <Sheet open={guide} onClose={() => setGuide(false)}>
        <h3>Size guide</h3>
        <p className="fine" style={{ margin: "0 0 10px", padding: 0 }}>
          Blouse sizes, in inches. Between sizes? Choose &quot;Stitch to my size&quot;.
        </p>
        <div className="tablewrap">
          <table className="sizes-table tab">
            <thead>
              <tr>
                <th>Size</th>
                <th>Bust</th>
                <th>Waist</th>
                <th>Shoulder</th>
              </tr>
            </thead>
            <tbody>
              {SIZE_GUIDE.map((r) => (
                <tr key={r[0]}>
                  {r.map((c, i) => (
                    <td key={i}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="sheet-actions">
          <button type="button" className="btn primary" onClick={() => setGuide(false)}>
            Got it
          </button>
        </div>
      </Sheet>
    </>
  );

}
