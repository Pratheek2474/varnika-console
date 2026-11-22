"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Ico } from "./Icons";
import { fallbackBg, inr, isNewProduct, offPct, productImages } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Product } from "@/lib/types";

/** Tiny data-loading hook. `run` re-runs when `deps` change. */
export function useAsync<T>(run: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const runRef = useRef(run);
  runRef.current = run;
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      setData(await runRef.current());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void load(), deps);
  return { data, error, loading, reload: load, setData };
}

export function Title({ t, sub }: { t: string; sub?: string }) {
  return (
    <div className="pagehead pad">
      <h2>
        {t}
        {sub ? <small>{sub}</small> : null}
      </h2>
    </div>
  );
}

export function Steps3({ n, labels }: { n: number; labels: string[] }) {
  return (
    <div className="steps3">
      {labels.map((l, i) => (
        <span key={l} className={i < n ? "done" : i === n ? "now" : ""}>
          <i>{i < n ? <Ico n="check" sm style={{ width: 11, height: 11 }} /> : i + 1}</i>
          {l}
        </span>
      ))}
    </div>
  );
}

export function ErrorBox({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="errbox">
      {message}
      {retry && (
        <button type="button" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Loading({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ padding: "8px 16px", display: "grid", gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 84 }} />
      ))}
    </div>
  );
}

export function SignInPrompt({ what, next }: { what: string; next: string }) {
  const { requireAuth } = useStore();
  return (
    <div className="empty">
      <img src="/art/vine.png" alt="" style={{ width: 120 }} />
      <h3>Sign in to see {what}</h3>
      <p>Use your phone number. It takes less than a minute.</p>
      <button className="btn primary" type="button" onClick={() => requireAuth(next)}>
        Sign in
      </button>
    </div>
  );
}

/** A product photo, or a brand-coloured placeholder when none has been added. */
export function ProductImage({
  product,
  className = "",
  index = 0,
}: {
  product: Product;
  className?: string;
  index?: number;
}) {
  const imgs = productImages(product);
  const src = imgs[Math.min(index, imgs.length - 1)];
  return (
    <div className={`pimg ${className}`} style={src ? undefined : { background: fallbackBg(product.id) }}>
      {src ? <img src={src} alt={product.name} loading="lazy" /> : null}
    </div>
  );
}

export function Thumb({ product, src, className = "thumb" }: { product?: Product; src?: string; className?: string }) {
  const url = src ?? (product ? productImages(product)[0] : undefined);
  return (
    <span className={`${className} pimg`} style={url ? undefined : { background: fallbackBg(product?.id ?? "x") }}>
      {url ? <img src={url} alt="" loading="lazy" /> : null}
    </span>
  );
}

export function ProductCard({ p }: { p: Product }) {
  const { favs, toggleFav, toast } = useStore();
  const off = offPct(p);
  const sold = !p.on_demand && p.stock <= 0;
  const low = !p.on_demand && p.stock > 0 && p.stock <= 5;
  const badge = sold ? (
    <span className="badge low">Sold out</span>
  ) : p.featured ? (
    <span className="badge gold">Handcrafted</span>
  ) : low ? (
    <span className="badge low">Only {p.stock} left</span>
  ) : isNewProduct(p) ? (
    <span className="badge">New</span>
  ) : null;
  const on = favs.has(p.id);
  return (
    <div className="pwrap">
      <Link href={`/p/${p.id}`} className="pcard">
        <div className="img">
          <ProductImage product={p} className="" />
          {badge}
        </div>
        <div>
          <div className="name">{p.name}</div>
          <div className="mat">{p.material}</div>
        </div>
        <div className="price tab">
          <b>{inr(p.price)}</b>
          {off ? (
            <>
              <s>{inr(p.mrp)}</s>
              <span className="off">{off}% off</span>
            </>
          ) : null}
        </div>
      </Link>
      <button
        type="button"
        className={`fav ${on ? "on" : ""}`}
        aria-label={on ? "Remove from saved" : "Save"}
        style={{ top: "calc(100% - 74px)" }}
        onClick={() => {
          toggleFav(p.id);
          toast(on ? "Removed from saved" : "Saved");
        }}
      >
        <Ico n="heart" sm />
      </button>
    </div>
  );
}

export function Grid({ list }: { list: Product[] }) {
  return (
    <div className="grid2">
      {list.map((p) => (
        <ProductCard key={p.id} p={p} />
      ))}
    </div>
  );
}
