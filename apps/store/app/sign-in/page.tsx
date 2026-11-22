"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Ico } from "@/components/Icons";

export default function SignIn() {
  const router = useRouter();
  const { sendCode } = useStore();
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setErr("Enter a 10-digit mobile number.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await sendCode(digits);
      router.push(`/sign-in/verify?p=${digits}`);
    } catch (e2) {
      setErr((e2 as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="welcome">
      <img className="vine" src="/art/vine.png" alt="" />
      <button className="icon-btn" type="button" onClick={() => router.back()} aria-label="Close" style={{ alignSelf: "flex-start", marginLeft: -10 }}>
        <Ico n="back" />
      </button>
      <h2>Sign in to continue</h2>
      <p>Use your mobile number. We&apos;ll text you a code, and your orders and measurements stay with your account.</p>
      <form className="form" onSubmit={submit} noValidate>
        <label className="field">
          <span>Mobile number</span>
          <div className="prefixed">
            <b>+91</b>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={11}
              placeholder="98480 00000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel-national"
              autoFocus
            />
          </div>
        </label>
        {err && <p className="err">{err}</p>}
        <button className="btn primary block" type="submit" disabled={busy}>
          {busy ? "Sending…" : "Send code"}
        </button>
      </form>
      <small>By continuing you agree to Varnika&apos;s terms and privacy policy.</small>
    </div>
  );
}
