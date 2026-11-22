"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Ico, type IconName } from "./Icons";
import { useStore } from "@/lib/store";
import { inr } from "@/lib/format";
import { WHATSAPP_NUMBER } from "@/lib/config";
import { Sheet } from "./Sheet";
import { InstallButton } from "./InstallButton";

const TABS: [string, IconName, string, string][] = [
  ["/", "home", "Home", "home"],
  ["/explore", "grid", "Explore", "explore"],
  ["/stitch", "needle", "Stitch", "stitch"],
  ["/orders", "box", "Orders", "orders"],
  ["/account", "user", "Account", "account"],
];

/** Screens that sit at the root of a tab (no back arrow). */
const ROOTS = new Set(["/", "/explore", "/stitch", "/orders", "/account", "/checkout/done", "/stitch/done"]);

function tabOf(path: string): string {
  if (path === "/" || path.startsWith("/search")) return "home";
  if (path.startsWith("/explore") || path.startsWith("/p/") || path.startsWith("/saved")) return "explore";
  if (path.startsWith("/stitch") || path.startsWith("/visit")) return "stitch";
  if (path.startsWith("/orders")) return "orders";
  if (path.startsWith("/account") || path.startsWith("/measurements") || path.startsWith("/help")) return "account";
  return "";
}

interface ShellCtx {
  setHasAction: (v: boolean) => void;
}
const ShellContext = createContext<ShellCtx>({ setHasAction: () => {} });

/** Renders its children in the sticky bar above the bottom nav. */
export function Action({ children }: { children: React.ReactNode }) {
  const { setHasAction } = useContext(ShellContext);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setTarget(document.getElementById("actbar"));
    setHasAction(true);
    return () => setHasAction(false);
  }, [setHasAction]);
  return target ? createPortal(children, target) : null;
}

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { bagCount, bagSubtotal, toastMsg, customer } = useStore();
  const [hasAction, setHasAction] = useState(false);
  const [waOpen, setWaOpen] = useState(false);
  const [scrollKey, setScrollKey] = useState(path);

  const bare = path.startsWith("/sign-in");
  const wide = path === "/" || path.startsWith("/explore") || path.startsWith("/search") || path.startsWith("/saved") || path.startsWith("/p/");
  const root = ROOTS.has(path);
  const tab = tabOf(path);

  // new screen → back to the top
  useEffect(() => {
    setScrollKey(path);
    const v = document.getElementById("view");
    if (v && path !== "/chat") v.scrollTop = 0;
  }, [path]);

  const showBar =
    bagCount > 0 && !hasAction && ["/", "/explore", "/saved", "/search", "/orders", "/account"].includes(path);

  const wa = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi Varnika, I have a question.")}`
    : null;

  return (
    <ShellContext.Provider value={{ setHasAction }}>
      <div className="screen">
        {!bare && (
          <header className="apphead">
            <div className="brand">
              {!root && (
                <button className="icon-btn" type="button" onClick={() => router.back()} aria-label="Back">
                  <Ico n="back" />
                </button>
              )}
              <Link href="/" className="logo" aria-label="Varnika home">
                <img src="/brand/varnika-wordmark.png" alt="Varnika" />
              </Link>
            </div>
            <nav className="dtabs" aria-label="Main">
              {TABS.map(([href, , label, key]) => (
                <Link key={key} href={href} className={tab === key ? "on" : ""}>
                  {label}
                </Link>
              ))}
            </nav>
            <InstallButton />
            <Link href="/chat" className="icon-btn" aria-label="Chat with Varnika">
              <Ico n="chat" />
            </Link>
            <button className="icon-btn" type="button" onClick={() => setWaOpen(true)} aria-label="WhatsApp Varnika">
              <Ico n="wa" />
            </button>
            <Link href="/bag" className="icon-btn" aria-label="Bag">
              <Ico n="bag" />
              {bagCount > 0 && <span className="count tab">{bagCount}</span>}
            </Link>
          </header>
        )}

        <main id="view" key={scrollKey} className={`view screen-in ${bare ? "bare" : ""} ${hasAction ? "has-action" : ""}`}>
          <div className={`page ${wide ? "wide" : ""}`}>{children}</div>
        </main>

        <div id="actbar" className="action" hidden={!hasAction} />

        {showBar && (
          <Link href="/bag" className="cartbar">
            <div>
              <small>
                {bagCount} item{bagCount > 1 ? "s" : ""} in bag
              </small>
              <b className="tab">{inr(bagSubtotal)}</b>
            </div>
            <span>
              View bag <Ico n="right" sm />
            </span>
          </Link>
        )}

        {!bare && (
          <nav className="nav">
            {TABS.map(([href, icon, label, key]) => (
              <Link key={key} href={href} className={tab === key ? "on" : ""}>
                <Ico n={icon} />
                {label}
              </Link>
            ))}
          </nav>
        )}

        <div id="overlay" />
        <div className={`toast ${toastMsg ? "show" : ""}`} role="status">
          {toastMsg}
        </div>

        <Sheet open={waOpen} onClose={() => setWaOpen(false)}>
          <h3>Chat on WhatsApp</h3>
          <p className="fine" style={{ margin: 0, padding: 0 }}>
            {wa
              ? "This opens WhatsApp with a message to Varnika Boutique. Prefer to stay here? Use the in-app chat."
              : "WhatsApp isn't set up yet. You can reach us on the in-app chat."}
          </p>
          <div className="sheet-actions">
            <Link href="/chat" className="btn ghost" onClick={() => setWaOpen(false)}>
              In-app chat
            </Link>
            {wa && (
              <a href={wa} target="_blank" rel="noreferrer" className="btn primary" onClick={() => setWaOpen(false)}>
                Open WhatsApp
              </a>
            )}
          </div>
        </Sheet>
        {customer ? null : null}
      </div>
    </ShellContext.Provider>
  );
}
