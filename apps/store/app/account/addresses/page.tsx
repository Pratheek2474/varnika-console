"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { listAddresses, removeAddress } from "@/lib/data";
import { Ico } from "@/components/Icons";
import { ErrorBox, Loading, SignInPrompt, Title, useAsync } from "@/components/ui";

export default function Addresses() {
  const { customer, ready, toast } = useStore();
  const q = useAsync(() => (customer ? listAddresses(customer.id) : Promise.resolve([])), [customer?.id]);

  if (!ready || q.loading) return <Loading rows={2} />;
  if (!customer) return <SignInPrompt what="your addresses" next="/account/addresses" />;
  const list = q.data ?? [];

  return (
    <>
      <Title t="Addresses" />
      {q.error && <ErrorBox message={q.error} retry={q.reload} />}
      {list.length === 0 && !q.error && (
        <div className="empty" style={{ paddingTop: 20 }}>
          <h3>No addresses yet</h3>
          <p>Add one so checkout is quick.</p>
        </div>
      )}
      {list.map((a) => (
        <div className="mcard" key={a.id}>
          <div className="mhead">
            <div>
              <b>
                {a.label} · {a.full_name}
              </b>
              <span>
                {a.line}, {a.city} {a.pincode}
              </span>
              <span>+91 {a.phone}</span>
            </div>
            <button
              className="link"
              type="button"
              onClick={async () => {
                try {
                  await removeAddress(a.id);
                  toast("Address removed");
                  q.reload();
                } catch (e) {
                  toast((e as Error).message);
                }
              }}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <div className="rowgroup">
        <Link className="rowlink" href="/account/addresses/new">
          <Ico n="pin" />
          <span>Add a new address</span>
          <Ico n="right" sm />
        </Link>
      </div>
    </>
  );
}
