"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { lineUnit, listAddresses, placeOrder } from "@/lib/data";
import { SHIPPING } from "@/lib/config";
import { inr } from "@/lib/format";
import { Action } from "@/components/Shell";
import { Ico } from "@/components/Icons";
import { ErrorBox, Loading, Steps3, Title, useAsync } from "@/components/ui";

const ADDR_KEY = "varnika-checkout-address";

export default function Payment() {
  const router = useRouter();
  const { customer, ready, bagLines, bagCount, payable, clearBag, requireAuth, toast } = useStore();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addrs = useAsync(() => (customer ? listAddresses(customer.id) : Promise.resolve([])), [customer?.id]);

  useEffect(() => {
    if (ready && !customer) requireAuth("/checkout");
  }, [ready, customer, requireAuth]);

  if (!ready || addrs.loading) return <Loading rows={2} />;

  let selId: string | null = null;
  try {
    selId = sessionStorage.getItem(ADDR_KEY);
  } catch {
    /* ignore */
  }
  const addr = (addrs.data ?? []).find((a) => a.id === selId) ?? (addrs.data ?? [])[0];

  if (!bagCount || !addr) {
    return (
      <div className="empty">
        <h3>{bagCount ? "Choose a delivery address first" : "Your bag is empty"}</h3>
        <Link className="btn primary" href={bagCount ? "/checkout" : "/explore"}>
          {bagCount ? "Choose address" : "Browse styles"}
        </Link>
      </div>
    );
  }

  const place = async () => {
    if (!customer || placing) return;
    setPlacing(true);
    setError(null);
    try {
      const order = await placeOrder({ customer, lines: bagLines, address: addr });
      clearBag();
      router.replace(`/checkout/done?o=${order.id}`);
    } catch (e) {
      setError((e as Error).message);
      toast("Could not place the order");
      setPlacing(false);
    }
  };

  return (
    <>
      <Title t="Review and place order" />
      <Steps3 n={1} labels={["Address", "Payment", "Done"]} />
      <div className="bill tab">
        <h4>Order summary</h4>
        {bagLines.map(({ product: p, line }) => (
          <div key={p.id}>
            <span>
              {p.name} × {line.qty}
            </span>
            <span>{inr(lineUnit(p, line) * line.qty)}</span>
          </div>
        ))}
        <div>
          <span>Shipping</span>
          <span>{inr(SHIPPING)}</span>
        </div>
        <div className="total">
          <span>Total</span>
          <span>{inr(payable)}</span>
        </div>
      </div>
      <div className="note">
        <Ico n="pin" />
        <span>
          Delivering to <b>{addr.label}</b>: {addr.line}, {addr.city} {addr.pincode}
        </span>
      </div>
      <div className="note">
        <Ico n="cash" />
        <span>
          <b>Pay after you place the order.</b> We&apos;ll send the payment details on chat right away, and your order is
          confirmed once the payment reaches us.
        </span>
      </div>
      {error && <ErrorBox message={error} />}

      <Action>
        <div className="sum">
          <small>Total</small>
          <b className="tab">{inr(payable)}</b>
        </div>
        <button type="button" className="btn primary" disabled={placing} onClick={place}>
          {placing ? "Placing…" : "Place order"}
        </button>
      </Action>
    </>
  );
}
