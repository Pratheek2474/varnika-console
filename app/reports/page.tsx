"use client";

import React, { useEffect, useState } from "react";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CardsListSkeleton } from "@/components/ui/page-skeletons";
import { Download } from "lucide-react";
import { downloadCsv } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";

/** Supabase types to-one joins as arrays; runtime returns object|null. */
function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default function ReportsPage() {
  const [counts, setCounts] = useState({ txns: 0, customers: 0, orders: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [t, c, o] = await Promise.all([
          supabase.from("transactions").select("id", { count: "exact", head: true }),
          supabase.from("customers").select("id", { count: "exact", head: true }),
          supabase.from("orders").select("id", { count: "exact", head: true }),
        ]);
        setCounts({
          txns: t.count ?? 0,
          customers: c.count ?? 0,
          orders: o.count ?? 0,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const exportTransactions = async () => {
    const { data } = await supabase
      .from("transactions")
      .select("serial_number,occurred_at,payment_ref,payment_mode,amount,currency,customers(customer_name),orders(order_number)")
      .order("occurred_at", { ascending: false });
    downloadCsv(
      "transactions-ledger.csv",
      ["Serial", "Date", "Customer", "Order", "Mode", "Reference", "Amount", "Currency"],
      ((data ?? []) as unknown as {
        serial_number: number;
        occurred_at: string;
        payment_ref: string;
        payment_mode: string;
        amount: number;
        currency: string;
        customers: { customer_name: string } | { customer_name: string }[] | null;
        orders: { order_number: string } | { order_number: string }[] | null;
      }[]).map((t) => [
        t.serial_number,
        String(t.occurred_at).slice(0, 10),
        one(t.customers)?.customer_name ?? "",
        one(t.orders)?.order_number ?? "",
        String(t.payment_mode),
        String(t.payment_ref),
        Number(t.amount),
        String(t.currency),
      ])
    );
  };

  const exportCustomers = async () => {
    const { data } = await supabase
      .from("customers")
      .select("customer_name,email,phone,orders_count,total_spent,special_notes")
      .order("customer_name");
    downloadCsv(
      "customer-directory.csv",
      ["Name", "Email", "Phone", "Orders", "Total Spent", "Notes"],
      ((data ?? []) as unknown as {
        customer_name: string;
        email: string | null;
        phone: string | null;
        orders_count: number;
        total_spent: number;
        special_notes: string | null;
      }[]).map((c) => [
        c.customer_name,
        c.email ?? "",
        c.phone ?? "",
        Number(c.orders_count ?? 0),
        Number(c.total_spent ?? 0),
        c.special_notes ?? "",
      ])
    );
  };

  const exportOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("order_number,item_summary,total,status,priority,delivery_date,created_at,customers(customer_name)")
      .order("created_at", { ascending: false });
    downloadCsv(
      "orders-export.csv",
      ["Order", "Item", "Total", "Status", "Priority", "Delivery", "Placed", "Customer"],
      ((data ?? []) as unknown as {
        order_number: string;
        item_summary: string;
        total: number;
        status: string;
        priority: string;
        delivery_date: string | null;
        created_at: string;
        customers: { customer_name: string } | { customer_name: string }[] | null;
      }[]).map((o) => [
        o.order_number,
        o.item_summary,
        Number(o.total),
        o.status,
        o.priority,
        o.delivery_date ?? "",
        String(o.created_at).slice(0, 10),
        one(o.customers)?.customer_name ?? "",
      ])
    );
  };

  if (loading) return <CardsListSkeleton cards={3} />;

  return (
    <RouteGuard
      requiredPermission="reports.read"
      requiredFeature="reports"
      moduleName="Reports"
    >
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#E6E3DB]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">
              Reports
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Live exports generated from current console data.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 space-y-3">
            <h3 className="text-sm font-semibold text-black">
              Transactions Ledger
            </h3>
            <p className="text-xs text-neutral-500">
              Every payment record with customer, order, and mode. ({counts.txns} rows)
            </p>
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" onClick={exportTransactions}>
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </Button>
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="text-sm font-semibold text-black">
              Customer Directory
            </h3>
            <p className="text-xs text-neutral-500">
              Client contacts, order counts, and lifetime spend. ({counts.customers} rows)
            </p>
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" onClick={exportCustomers}>
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </Button>
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="text-sm font-semibold text-black">
              Orders Export
            </h3>
            <p className="text-xs text-neutral-500">
              All orders with status, priority, and delivery dates. ({counts.orders} rows)
            </p>
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" onClick={exportOrders}>
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </Button>
          </Card>
        </div>
      </div>
    </RouteGuard>
  );
}
