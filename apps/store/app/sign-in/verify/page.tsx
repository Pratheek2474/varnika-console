"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { phoneShow } from "@/lib/format";
import { Ico } from "@/components/Icons";

function Verify() {
  const router = useRouter();
  const digits = useSearchParams().get("p") ?? "";
  const { verifyCode, sendCode, consumeAfter, toast } = useStore();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.replace(/\D/g, "");
    if (c.length < 6) {
      setErr("Enter the 6-digit code.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await verifyCode(digits, c);
      toast("Welcome to Varnika");
      router.replace(consumeAfter() ?? "/");
    } catch (e2) {
      setErr((e2 as Error).message);
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      await sendCode(digits);
      toast("Code sent again");
    } catch (e2) {
      setErr((e2 as Error).message);
    }
  };

  return (
    <div className="welcome">
      <button className="icon-btn" type="button" onClick={() => router.back()} aria-label="Back" style={{ alignSelf: "flex-start", marginLeft: -10 }}>
        <Ico n="back" />
      </button>
      <h2>Enter the code</h2>
      <p>We sent a 6-digit code to +91 {phoneShow(digits)}.</p>
      <form className="form" onSubmit={submit} noValidate>
        <label className="field">
          <span>Verification code</span>
          <input
            className="otp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="••••••"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
          />
        </label>
        {err && <p className="err">{err}</p>}
        <button className="btn primary block" type="submit" disabled={busy}>
          {busy ? "Checking…" : "Verify and continue"}
        </button>
      </form>
      <button className="link" type="button" onClick={resend}>
        Resend code
      </button>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <Verify />
    </Suspense>
  );
}
