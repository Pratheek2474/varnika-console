"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Grid } from "@/components/ui";
import { Ico } from "@/components/Icons";

const RECENT_KEY = "varnika-recent";

export default function SearchPage() {
  const { products } = useStore();
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"));
    } catch {
      /* no history */
    }
  }, []);

  const remember = (term: string) => {
    const t = term.trim();
    if (t.length < 2) return;
    const next = [t, ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, 6);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const term = q.trim().toLowerCase();
  const results = term
    ? products.filter((p) =>
        `${p.name} ${p.material} ${p.category} ${p.subcategory} ${p.occasions.join(" ")}`.toLowerCase().includes(term)
      )
    : [];

  return (
    <>
      <div className="search" style={{ paddingTop: 4 }}>
        <label className="search-box live">
          <Ico n="search" sm />
          <input
            autoFocus
            type="search"
            placeholder="Search blouses, sarees, fabrics"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onBlur={() => remember(q)}
            autoComplete="off"
          />
          {q && (
            <button type="button" onClick={() => setQ("")} aria-label="Clear search">
              ✕
            </button>
          )}
        </label>
      </div>

      {!term ? (
        <>
          {recent.length > 0 && (
            <>
              <div className="sec" style={{ paddingTop: 8 }}>
                <h3 style={{ fontSize: 17 }}>Recent searches</h3>
              </div>
              <div className="chips" style={{ flexWrap: "wrap" }}>
                {recent.map((r) => (
                  <button key={r} type="button" className="chip" onClick={() => setQ(r)}>
                    <Ico n="clock" sm style={{ width: 13, height: 13 }} /> {r}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="sec">
            <h3 style={{ fontSize: 17 }}>Popular right now</h3>
          </div>
          <Grid list={products.filter((p) => p.featured).concat(products).slice(0, 2)} />
        </>
      ) : results.length ? (
        <>
          <p className="rescount">
            {results.length} result{results.length > 1 ? "s" : ""}
          </p>
          <Grid list={results} />
        </>
      ) : (
        <div className="empty" style={{ paddingTop: 36 }}>
          <h3>No matches for &quot;{q}&quot;</h3>
          <p>Try a fabric or garment, like &quot;silk&quot; or &quot;blouse&quot;. We also stitch custom designs.</p>
          <Link className="btn outline" href="/stitch">
            Ask for a custom design
          </Link>
        </div>
      )}
    </>
  );
}
