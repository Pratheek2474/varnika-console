"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { Grid, Title } from "@/components/ui";
import { Sheet } from "@/components/Sheet";
import { Ico } from "@/components/Icons";
import { inr } from "@/lib/format";
import type { Product } from "@/lib/types";

type Sort = "popular" | "low" | "high" | "new";
const SORTS: Record<Sort, string> = {
  popular: "Popular",
  low: "Price: low to high",
  high: "Price: high to low",
  new: "Newest first",
};

function Explore() {
  const params = useSearchParams();
  const { products, productsLoading } = useStore();
  const [cat, setCat] = useState(params.get("cat") ?? "All");
  const occ = params.get("occ");
  const [sort, setSort] = useState<Sort>("popular");
  const [price, setPrice] = useState<"any" | "low" | "mid" | "high">("any");
  const [craft, setCraft] = useState(false);
  const [stock, setStock] = useState(false);
  const [sheet, setSheet] = useState<"sort" | "filter" | null>(null);

  const cats = ["All", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];
  let list = products.filter((p) => (cat === "All" || p.category === cat) && (!occ || p.occasions.includes(occ)));
  if (price === "low") list = list.filter((p) => p.price < 2000);
  if (price === "mid") list = list.filter((p) => p.price >= 2000 && p.price <= 5000);
  if (price === "high") list = list.filter((p) => p.price > 5000);
  if (craft) list = list.filter((p) => p.featured);
  if (stock) list = list.filter((p) => p.on_demand || p.stock > 5);
  const sorters: Record<Sort, (a: Product, b: Product) => number> = {
    popular: (a, b) => Number(b.featured) - Number(a.featured),
    low: (a, b) => a.price - b.price,
    high: (a, b) => b.price - a.price,
    new: (a, b) => b.created_at.localeCompare(a.created_at),
  };
  const sorted = [...list].sort(sorters[sort]);
  const n = (price !== "any" ? 1 : 0) + (craft ? 1 : 0) + (stock ? 1 : 0);
  const clear = () => {
    setPrice("any");
    setCraft(false);
    setStock(false);
    setSheet(null);
  };

  return (
    <>
      <Title t={occ ?? "Explore"} />
      <div className="chips">
        {cats.map((c) => (
          <button key={c} type="button" className={`chip ${cat === c ? "on" : ""}`} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="toolbar">
        <span>
          {sorted.length} style{sorted.length === 1 ? "" : "s"}
        </span>
        <div>
          <button type="button" onClick={() => setSheet("sort")}>
            {SORTS[sort].split(":")[0]} <Ico n="down" sm style={{ width: 13, height: 13 }} />
          </button>
          <button type="button" onClick={() => setSheet("filter")}>
            <Ico n="sliders" sm style={{ width: 14, height: 14 }} /> Filter{n ? ` · ${n}` : ""}
          </button>
        </div>
      </div>
      {productsLoading ? (
        <div className="grid2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: "3/4", borderRadius: 40 }} />
          ))}
        </div>
      ) : sorted.length ? (
        <Grid list={sorted} />
      ) : (
        <div className="empty" style={{ paddingTop: 30 }}>
          <h3>{n ? "Nothing matches these filters" : "No styles here yet"}</h3>
          <p>{n ? "Try removing a filter or two." : "New styles are on their way."}</p>
          {n > 0 && (
            <button className="btn outline" type="button" onClick={clear}>
              Clear filters
            </button>
          )}
        </div>
      )}

      <Sheet open={sheet === "sort"} onClose={() => setSheet(null)}>
        <h3>Sort by</h3>
        {(Object.keys(SORTS) as Sort[]).map((k) => (
          <button
            key={k}
            type="button"
            className={`option ${sort === k ? "on" : ""}`}
            onClick={() => {
              setSort(k);
              setSheet(null);
            }}
          >
            <span className="radio" />
            <div>
              <b>{SORTS[k]}</b>
            </div>
          </button>
        ))}
      </Sheet>

      <Sheet open={sheet === "filter"} onClose={() => setSheet(null)}>
        <h3>Filter</h3>
        <h4>Price</h4>
        <div className="chips" style={{ flexWrap: "wrap", padding: 0 }}>
          {(
            [
              ["any", "Any"],
              ["low", `Under ${inr(2000)}`],
              ["mid", `${inr(2000)} to ${inr(5000)}`],
              ["high", `Above ${inr(5000)}`],
            ] as const
          ).map(([k, l]) => (
            <button key={k} type="button" className={`chip ${price === k ? "on" : ""}`} onClick={() => setPrice(k)}>
              {l}
            </button>
          ))}
        </div>
        <h4>More</h4>
        <div className="chips" style={{ flexWrap: "wrap", padding: 0 }}>
          <button type="button" className={`chip ${craft ? "on" : ""}`} onClick={() => setCraft(!craft)}>
            Handcrafted only
          </button>
          <button type="button" className={`chip ${stock ? "on" : ""}`} onClick={() => setStock(!stock)}>
            Plenty in stock
          </button>
        </div>
        <div className="sheet-actions">
          <button type="button" className="btn ghost" onClick={clear}>
            Clear
          </button>
          <button type="button" className="btn primary" onClick={() => setSheet(null)}>
            Show {sorted.length} style{sorted.length === 1 ? "" : "s"}
          </button>
        </div>
      </Sheet>
    </>
  );
}

export default function ExplorePage() {
  return (
    <Suspense>
      <Explore />
    </Suspense>
  );
}
