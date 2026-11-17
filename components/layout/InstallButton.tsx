"use client";

import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// The browser fires this once, early. Capture it at module load so a button
// that mounts later can still use it.
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

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
}

/** One-tap "Install app" button. Hidden once installed. */
export function InstallButton({ className }: { className?: string }) {
  const [, force] = useState(0);
  const [ready, setReady] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    setReady(true);
    return () => {
      listeners.delete(l);
    };
  }, []);

  if (!ready || isStandalone()) return null;

  const ios = isIos();
  // Android/desktop Chrome & Edge expose a real prompt; iOS needs manual steps.
  if (!deferred && !ios) return null;

  const onClick = async () => {
    if (deferred) {
      const ev = deferred;
      deferred = null;
      await ev.prompt();
      await ev.userChoice;
      listeners.forEach((l) => l());
    } else {
      setHelp(true);
    }
  };

  return (
    <>
      <button
        onClick={onClick}
        title="Install Varnika Console"
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium border border-wine text-wine rounded-full hover:bg-wine hover:text-white transition-colors",
          className
        )}
      >
        <Download className="w-3.5 h-3.5" />
        Install
      </button>
      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Install on your iPhone</DialogTitle>
            <DialogDescription>Safari doesn&apos;t allow one-tap install, so it takes two steps.</DialogDescription>
          </DialogHeader>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-neutral-700">
            <li>Tap the <b>Share</b> button at the bottom of Safari.</li>
            <li>Choose <b>Add to Home Screen</b>, then tap <b>Add</b>.</li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}
