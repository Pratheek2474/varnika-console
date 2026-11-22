"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Grid, Title } from "@/components/ui";

export default function Saved() {
  const { products, favs } = useStore();
  const list = products.filter((p) => favs.has(p.id));
  return (
    <>
      <Title t="Saved styles" sub={list.length ? `${list.length} item${list.length > 1 ? "s" : ""}` : undefined} />
      {list.length ? (
        <Grid list={list} />
      ) : (
        <div className="empty">
          <img src="/art/vine.png" alt="" style={{ width: 120 }} />
          <h3>Nothing saved yet</h3>
          <p>Tap the heart on any style to keep it here.</p>
          <Link className="btn primary" href="/explore">
            Browse styles
          </Link>
        </div>
      )}
    </>
  );
}
