"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { listAddresses } from "@/lib/data";
import { READY_DAYS, STITCH_DAYS } from "@/lib/config";
import { Action } from "@/components/Shell";
import { Ico } from "@/components/Icons";
import { ErrorBox, Loading, Steps3, Title, useAsync } from "@/components/ui";

const ADDR_KEY = "varnika-checkout-address";

export default function CheckoutAddress() {
  const router = useRouter();
  const { customer, ready, bagCount, requireAuth } = useStore();
  const [sel, setSel] = useState<string | null>(null);
  const addrs = useAsync(() => (customer ? listAddresses(customer.id) : Promise.resolve([])), [customer?.id]);

  useEffect(() => {
    if (ready && !customer) requireAuth("/checkout");
  }, [ready, customer, requireAuth]);

  const list = addrs.data ?? [];
  useEffect(() => {
    if (!list.length) return;
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(ADDR_KEY);
    } catch {
      /* ignore */
    }
    setSel(list.find((a) => a.id === saved)?.id ?? list[0].id);
  }, [list.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready || addrs.loading) return <Loading rows={2} />;
  if (!bagCount) {
    return (
      <div className="empty">
        <h3>Your bag is empty</h3>
        <Link className="btn primary" href="/explore">
          Browse styles
        </Link>
      </div>
    );
  }

  return (
    <>
      <Title t="Delivery address" />
      <Steps3 n={0} labels={["Address", "Payment", "Done"]} />
      {addrs.error && <ErrorBox message={addrs.error} retry={addrs.reload} />}
      {list.map((a) => (
        <button key={a.id} type="button" className={`option ${sel === a.id ? "on" : ""}`} onClick={() => setSel(a.id)}>
          <span className="radio" />
          <div>
            <b>
              {a.label} · {a.full_name}
            </b>
            <span>
              {a.line}, {a.city} {a.pincode}
            </span>
            <span>+91 {a.phone}</span>
          </div>
        </button>
      ))}
      <Link href="/account/addresses/new?from=checkout" className="rowlink" style={{ margin: "4px 16px 0" }}>
        <Ico n="pin" />
        <span>Add a new address</span>
        <Ico n="right" sm />
      </Link>
      <div className="note">
        <Ico n="box" />
        <span>
          Stitched pieces ship in {STITCH_DAYS}. Standard sizes ship in {READY_DAYS}.
        </span>
      </div>

      <Action>
        <button
          type="button"
          className="btn primary"
          disabled={!sel}
          onClick={() => {
            try {
              if (sel) sessionStorage.setItem(ADDR_KEY, sel);
            } catch {
              /* ignore */
            }
            router.push("/checkout/payment");
          }}
        >
          {sel ? "Continue to payment" : "Add an address to continue"}
        </button>
      </Action>
    </>
  );
}
