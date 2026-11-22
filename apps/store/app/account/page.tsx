"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { latestVisit, listAddresses, listMeasurements } from "@/lib/data";
import { REPLY_TIME } from "@/lib/config";
import { longDate, phoneShow } from "@/lib/format";
import { Ico, type IconName } from "@/components/Icons";
import { Loading, SignInPrompt, Title, useAsync } from "@/components/ui";

export default function Account() {
  const router = useRouter();
  const { customer, ready, favs, signOut, toast } = useStore();
  const info = useAsync(async () => {
    if (!customer) return null;
    const [m, a, v] = await Promise.all([listMeasurements(customer), listAddresses(customer.id), latestVisit(customer.id)]);
    return { m: m.length, a: a.length, v };
  }, [customer?.id]);

  if (!ready) return <Loading rows={2} />;
  if (!customer) {
    return (
      <>
        <Title t="Account" />
        <SignInPrompt what="your account" next="/account" />
        <div className="rowgroup">
          <Link className="rowlink" href="/help">
            <Ico n="box" />
            <span>How to order</span>
            <Ico n="right" sm />
          </Link>
        </div>
      </>
    );
  }

  const d = info.data;
  const rows: [string, IconName, string, string][] = [
    ["/measurements", "tape", "My measurements", d ? (d.m ? `${d.m} saved` : "None yet") : ""],
    ["/saved", "heart", "Saved styles", `${favs.size} item${favs.size === 1 ? "" : "s"}`],
    ["/account/addresses", "pin", "Addresses", d ? `${d.a} saved` : ""],
    ["/visit", "clock", "Store visit", d?.v ? `${longDate(d.v.visit_on)}, ${d.v.slot}` : "Book a time to be measured"],
    ["/chat", "chat", "Chat with Varnika", REPLY_TIME],
    ["/help", "box", "How to order", "Steps, shipping and payment"],
  ];
  const name = customer.customer_name || "Add your name";

  return (
    <>
      <Title t="Account" />
      <Link href="/account/profile" className="profile">
        <span className="avatar">{(customer.customer_name || "V").charAt(0).toUpperCase()}</span>
        <div>
          <b>{name}</b>
          <span>+91 {phoneShow(customer.phone)}</span>
        </div>
        <span className="link">Edit</span>
      </Link>
      <div className="rowgroup">
        {rows.map(([href, icon, t, s]) => (
          <Link key={href} href={href} className="rowlink tall">
            <Ico n={icon} />
            <span>
              <b>{t}</b>
              <small>{s}</small>
            </span>
            <Ico n="right" sm />
          </Link>
        ))}
      </div>
      <div style={{ padding: "18px 16px 0" }}>
        <button
          className="btn ghost block"
          type="button"
          onClick={async () => {
            await signOut();
            toast("Signed out");
            router.replace("/");
          }}
        >
          Sign out
        </button>
      </div>
      <p className="fine" style={{ textAlign: "center" }}>
        Varnika Boutique by Sujatha Panjam
      </p>
    </>
  );
}
