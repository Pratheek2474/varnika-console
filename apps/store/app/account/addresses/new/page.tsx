"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { addAddress } from "@/lib/data";
import { phoneShow } from "@/lib/format";
import { Action } from "@/components/Shell";
import { Loading, SignInPrompt, Title } from "@/components/ui";

function NewAddress() {
  const router = useRouter();
  const from = useSearchParams().get("from");
  const { customer, ready, toast } = useStore();
  const [f, setF] = useState({
    full_name: customer?.customer_name ?? "",
    phone: customer ? phoneShow(customer.phone) : "",
    line: "",
    city: "Hyderabad",
    pincode: "",
    label: "Home",
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!ready) return <Loading rows={2} />;
  if (!customer) return <SignInPrompt what="your addresses" next="/account/addresses" />;

  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const save = async () => {
    const pin = f.pincode.replace(/\D/g, "");
    if (!f.full_name.trim() || !f.line.trim() || !f.city.trim() || pin.length !== 6) {
      setErr("Fill in the name, address, city and a 6-digit pincode.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const a = await addAddress(customer.id, {
        label: f.label,
        full_name: f.full_name.trim(),
        phone: f.phone.replace(/\D/g, "").slice(-10),
        line: f.line.trim(),
        city: f.city.trim(),
        pincode: pin,
      });
      toast("Address saved");
      if (from === "checkout") {
        try {
          sessionStorage.setItem("varnika-checkout-address", a.id);
        } catch {
          /* ignore */
        }
      }
      router.back();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <>
      <Title t="New address" />
      <div className="form pad">
        <label className="field">
          <span>Full name</span>
          <input type="text" value={f.full_name} onChange={(e) => set("full_name", e.target.value)} autoComplete="name" />
        </label>
        <label className="field">
          <span>Mobile number</span>
          <div className="prefixed">
            <b>+91</b>
            <input type="tel" inputMode="numeric" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
        </label>
        <label className="field">
          <span>Flat, house, street</span>
          <input type="text" placeholder="Flat 302, Road No. 12" value={f.line} onChange={(e) => set("line", e.target.value)} />
        </label>
        <div className="two">
          <label className="field">
            <span>City</span>
            <input type="text" value={f.city} onChange={(e) => set("city", e.target.value)} />
          </label>
          <label className="field">
            <span>Pincode</span>
            <input type="text" inputMode="numeric" maxLength={6} placeholder="500034" value={f.pincode} onChange={(e) => set("pincode", e.target.value)} />
          </label>
        </div>
        <div className="field">
          <span>Save as</span>
          <div className="chips" style={{ padding: 0 }}>
            {["Home", "Work", "Other"].map((l) => (
              <button key={l} type="button" className={`chip ${f.label === l ? "on" : ""}`} onClick={() => set("label", l)}>
                {l}
              </button>
            ))}
          </div>
        </div>
        {err && <p className="err">{err}</p>}
      </div>
      <Action>
        <button type="button" className="btn primary" disabled={busy} onClick={save}>
          {busy ? "Saving…" : "Save address"}
        </button>
      </Action>
    </>
  );
}

export default function NewAddressPage() {
  return (
    <Suspense>
      <NewAddress />
    </Suspense>
  );
}
