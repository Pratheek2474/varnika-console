"use client";

import React, { useEffect, useState } from "react";
import { Ico } from "./Icons";
import { Sheet } from "./Sheet";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// The browser fires this once, early. Capture it at module load so a button that mounts later can still use it.
let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}

const standalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const ios = () => {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
};

/** One-tap "Install" button. Hidden once the app is installed. iPhone gets a two-step guide. */
export function InstallButton() {
  const [, force] = useState(0);
  const [ready, setReady] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    setReady(true);
    return () => void listeners.delete(l);
  }, []);

  if (!ready || standalone()) return null;
  const isIos = ios();
  if (!deferred && !isIos) return null;

  const click = async () => {
    if (deferred) {
      const ev = deferred;
      deferred = null;
      await ev.prompt();
      await ev.userChoice;
      listeners.forEach((l) => l());
    } else setHelp(true);
  };

  return (
    <>
      <button type="button" className="install-btn" onClick={click} title="Install Varnika">
        <Ico n="download" sm />
        Install
      </button>
      <Sheet open={help} onClose={() => setHelp(false)}>
        <h3>Install on your iPhone</h3>
        <ol className="howto" style={{ padding: 0 }}>
          <li>
            <i className="tab">1</i>
            <div>
              <b>Tap the Share button</b>
              <span>It&apos;s at the bottom of Safari.</span>
            </div>
          </li>
          <li>
            <i className="tab">2</i>
            <div>
              <b>Choose Add to Home Screen</b>
              <span>Then tap Add.</span>
            </div>
          </li>
        </ol>
        <div className="sheet-actions">
          <button type="button" className="btn primary" onClick={() => setHelp(false)}>
            Got it
          </button>
        </div>
      </Sheet>
    </>
  );
}
