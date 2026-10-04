"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { ActivityRow } from "@/lib/supabase/database.types";
import { listActivity } from "@/lib/supabase/activity";
import { Badge } from "@/components/ui/badge";
import { CardsListSkeleton } from "@/components/ui/page-skeletons";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "customer", label: "Customers" },
  { key: "order", label: "Orders" },
  { key: "transaction", label: "Transactions" },
  { key: "shipment", label: "Shipments" },
  { key: "ticket", label: "Tickets" },
  { key: "conversation", label: "Chats" },
  { key: "product", label: "Products" },
  { key: "employee", label: "Team" },
];

const VERBS: Record<string, string> = {
  added: "added",
  edited: "edited",
  status_changed: "changed status",
  resolved: "resolved",
  raised: "raised",
  milestone: "added milestone",
};

const ENTITY_NOUN: Record<string, string> = {
  customer: "customer",
  order: "order",
  transaction: "transaction",
  shipment: "shipment",
  ticket: "ticket",
  conversation: "chat",
  product: "product",
  employee: "team member",
};

function CustomerLink({ id, name }: { id: string | null; name: string }) {
  if (!name) return null;
  const label = <span className="underline underline-offset-2">{name}</span>;
  return id ? (
    <Link href={`/customers/${id}`} className="font-medium text-black hover:text-neutral-600">
      {label}
    </Link>
  ) : (
    <span className="font-medium text-black">{label}</span>
  );
}

function OrderLink({ id, number }: { id: string | null; number: string }) {
  if (!number) return null;
  const label = <span className="underline underline-offset-2 font-mono">{number}</span>;
  return id ? (
    <Link href={`/orders/${id}`} className="font-medium text-black hover:text-neutral-600">
      {label}
    </Link>
  ) : (
    <span className="font-medium text-black">{label}</span>
  );
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function FeedItem({ item }: { item: ActivityRow }) {
  const verb = VERBS[item.action] ?? item.action;
  const noun = ENTITY_NOUN[item.entity_type] ?? item.entity_type;

  return (
    <div className="p-4 bg-white border border-[#E6E3DB] rounded-xs">
      <div className="text-xs text-black leading-relaxed">
        <span className="font-semibold">{item.actor_name}</span>{" "}
        <span className="text-neutral-500">{verb}</span>{" "}
        <span className="text-neutral-500">{noun}</span>{" "}
        {item.entity_type === "customer" ? (
          <CustomerLink id={item.entity_id} name={item.entity_label || item.customer_name} />
        ) : item.entity_type === "order" ? (
          <>
            <OrderLink id={item.entity_id} number={item.entity_label || item.order_number} />
            {item.customer_name && (
              <>
                {" "}<span className="text-neutral-500">for</span>{" "}
                <CustomerLink id={item.customer_id} name={item.customer_name} />
              </>
            )}
          </>
        ) : item.entity_type === "transaction" ? (
          <>
            {item.customer_name && (
              <>
                <span className="text-neutral-500">for</span>{" "}
                <CustomerLink id={item.customer_id} name={item.customer_name} />
              </>
            )}
            {item.order_number && (
              <>
                {" "}<span className="text-neutral-500">and</span>{" "}
                <OrderLink id={item.order_id} number={item.order_number} />
              </>
            )}
          </>
        ) : item.entity_type === "shipment" ? (
          <>
            <span className="font-mono font-medium">{item.entity_label}</span>
            {item.order_number && (
              <>
                {" "}<span className="text-neutral-500">for order</span>{" "}
                <OrderLink id={item.order_id} number={item.order_number} />
              </>
            )}
          </>
        ) : item.entity_type === "ticket" ? (
          <>
            <span className="font-mono font-medium">{item.entity_label}</span>
            {item.customer_name && (
              <>
                {" "}<span className="text-neutral-500">·</span>{" "}
                <CustomerLink id={item.customer_id} name={item.customer_name} />
              </>
            )}
            {item.order_number && (
              <>
                {" "}<span className="text-neutral-500">·</span>{" "}
                <OrderLink id={item.order_id} number={item.order_number} />
              </>
            )}
          </>
        ) : item.entity_type === "conversation" ? (
          <>
            <Link href="/chat" className="font-medium underline underline-offset-2">
              {item.entity_label || "chat"}
            </Link>
            {item.customer_name && (
              <>
                {" "}<span className="text-neutral-500">with</span>{" "}
                <CustomerLink id={item.customer_id} name={item.customer_name} />
              </>
            )}
            {item.order_number && (
              <>
                {" "}<span className="text-neutral-500">·</span>{" "}
                <OrderLink id={item.order_id} number={item.order_number} />
              </>
            )}
          </>
        ) : (
          <span className="font-medium">{item.entity_label}</span>
        )}
        {item.detail && (
          <span className="text-neutral-500"> — {item.detail}</span>
        )}
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <Badge variant="secondary" className="text-[9px] capitalize">
          {noun}
        </Badge>
        <span className="text-[11px] font-mono text-neutral-400">
          {formatDateTime(item.created_at)}
        </span>
      </div>
    </div>
  );
}

export default function UpdatesPage() {
  const [items, setItems] = useState<ActivityRow[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      setLoadError(null);
      setItems(await listActivity(150));
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = filter === "all" ? items : items.filter((i) => i.entity_type === filter);

  // Group newest-first items by calendar date for date-separated scrolling.
  const groups = React.useMemo(() => {
    const out: { key: string; label: string; rows: ActivityRow[] }[] = [];
    for (const item of filtered) {
      const key = dayKey(item.created_at);
      const last = out[out.length - 1];
      if (last && last.key === key) {
        last.rows.push(item);
      } else {
        out.push({ key, label: dayLabel(item.created_at), rows: [item] });
      }
    }
    return out;
  }, [filtered]);

  if (loading) return <CardsListSkeleton cards={5} />;

  return (
    <RouteGuard requiredPermission="home.read" moduleName="Updates">
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Header */}
        <div className="pb-4 border-b border-[#E6E3DB]">
          <h1 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">
            Updates
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Every change, who made it, and when — newest first.
          </p>
        </div>

        {loadError && (
          <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xs">
            {loadError}{" "}
            <button onClick={refresh} className="underline font-medium">Retry</button>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            const count =
              f.key === "all"
                ? items.length
                : items.filter((i) => i.entity_type === f.key).length;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "px-3 py-1.5 transition-colors rounded-xs whitespace-nowrap flex items-center gap-1.5",
                  isActive
                    ? "bg-black text-white font-medium"
                    : "bg-white border border-[#E6E3DB] text-neutral-600 hover:text-black hover:border-black"
                )}
              >
                {f.label}
                <span className={cn("font-mono text-[10px]", isActive ? "text-white/70" : "text-neutral-400")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Feed — separated by date */}
        <div className="space-y-8 max-w-3xl">
          {groups.map((group) => (
            <section key={group.key} className="space-y-3">
              <div className="sticky top-14 z-10 -mx-1 px-1 py-2 bg-[#FBF9F5]">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-black whitespace-nowrap">
                    {group.label}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    {group.rows.length} update{group.rows.length === 1 ? "" : "s"}
                  </span>
                  <div className="flex-1 h-px bg-[#E6E3DB]" />
                </div>
              </div>
              {group.rows.map((item) => (
                <FeedItem key={item.id} item={item} />
              ))}
            </section>
          ))}
          {filtered.length === 0 && !loadError && (
            <div className="text-center py-12 text-xs text-neutral-400">
              No updates yet — changes made anywhere in the console will appear here.
            </div>
          )}
        </div>
      </div>
    </RouteGuard>
  );
}
