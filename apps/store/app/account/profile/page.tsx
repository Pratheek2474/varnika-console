"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { updateCustomer } from "@/lib/data";
import { phoneShow } from "@/lib/format";
import { Action } from "@/components/Shell";
import { Loading, SignInPrompt, Title } from "@/components/ui";

export default function Profile() {
  const router = useRouter();
  const { customer, ready, setCustomer, toast } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (customer) {
      setName(customer.customer_name);
      setEmail(customer.email ?? "");
    }
  }, [customer]);

  if (!ready) return <Loading rows={2} />;
  if (!customer) return <SignInPrompt what="your details" next="/account/profile" />;

  const save = async () => {
    if (!name.trim()) {
      setErr("Enter your name.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      setCustomer(await updateCustomer(customer.id, { customer_name: name.trim(), email: email.trim() }));
      toast("Details saved");
      router.back();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <>
      <Title t="Your details" />
      <div className="form pad">
        <label className="field">
          <span>Full name</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </label>
        <label className="field">
          <span>Mobile number</span>
          <div className="prefixed">
            <b>+91</b>
            <input type="tel" value={phoneShow(customer.phone)} disabled />
          </div>
          <em>Your sign-in number. Message us to change it.</em>
        </label>
        <label className="field">
          <span>Email (optional, for invoices)</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        {err && <p className="err">{err}</p>}
      </div>
      <Action>
        <button type="button" className="btn primary" disabled={busy} onClick={save}>
          {busy ? "Saving…" : "Save"}
        </button>
      </Action>
    </>
  );
}
