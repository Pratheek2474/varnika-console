"use client";

import React, { useEffect, useState } from "react";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CardsListSkeleton } from "@/components/ui/page-skeletons";
import { Download, FileSpreadsheet } from "lucide-react";
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
  const [exporting, setExporting] = useState(false);

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

  const exportFullExcel = async () => {
    setExporting(true);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();
      const stamp = new Date().toISOString().slice(0, 10);

      const addSheet = (name: string, rows: Record<string, unknown>[]) => {
        const ws = XLSX.utils.json_to_sheet(rows);
        ws["!cols"] = Object.keys(rows[0] ?? {}).map(() => ({ wch: 22 }));
        XLSX.utils.book_append_sheet(wb, ws, name);
      };

      const [ordersRes, itemsRes, custRes, prodRes, txnRes, shipRes, actRes] = await Promise.all([
        supabase.from("orders").select("order_number,item_summary,total,currency,status,priority,is_paid,delivery_date,notes,created_at,customers(customer_name)").order("created_at", { ascending: false }),
        supabase.from("order_items").select("order_id,name,detail,qty,price,orders(order_number)").order("position"),
        supabase.from("customers").select("customer_name,email,phone,orders_count,total_spent,special_notes").order("customer_name"),
        supabase.from("products").select("sku,name,category,subcategory,price,stock,material,featured").order("name"),
        supabase.from("transactions").select("serial_number,occurred_at,payment_ref,payment_mode,amount,currency,customers(customer_name),orders(order_number)").order("occurred_at", { ascending: false }),
        supabase.from("shipments").select("tracking_number,carrier,recipient_name,destination_city,address,status,estimated_delivery,orders(order_number)").order("created_at", { ascending: false }),
        supabase.from("activity_log").select("created_at,actor_name,action,entity_type,entity_label,customer_name,order_number,detail").order("created_at", { ascending: false }).limit(2000),
      ]);

      type Join = { customer_name?: string; order_number?: string } | { customer_name?: string; order_number?: string }[] | null;
      const custName = (j: Join) => (Array.isArray(j) ? j[0]?.customer_name : j?.customer_name) ?? "";
      const ordNo = (j: Join) => (Array.isArray(j) ? j[0]?.order_number : j?.order_number) ?? "";

      addSheet("Orders", (((ordersRes.data ?? []) as unknown as Record<string, unknown>[]) as Record<string, never>[]).map((o) => ({
        Order: o.order_number, Customer: custName(o.customers as Join), Item: o.item_summary,
        Total: Number(o.total), Currency: o.currency, Status: o.status, Paid: o.is_paid ? "Yes" : "No",
        Priority: o.priority, Delivery: o.delivery_date ?? "", Notes: o.notes ?? "",
        Placed: String(o.created_at).slice(0, 10),
      })));
      addSheet("Order Items", (((itemsRes.data ?? []) as unknown as Record<string, never>[]) ?? []).map((i) => ({
        Order: ordNo(i.orders as Join), Item: i.name, Detail: i.detail ?? "",
        Qty: Number(i.qty), Price: Number(i.price),
      })));
      addSheet("Customers", (((custRes.data ?? []) as unknown as Record<string, never>[]) ?? []).map((c) => ({
        Name: c.customer_name, Email: c.email ?? "", Phone: c.phone ?? "",
        Orders: Number(c.orders_count ?? 0), "Total Spent": Number(c.total_spent ?? 0), Notes: c.special_notes ?? "",
      })));
      addSheet("Products", (((prodRes.data ?? []) as unknown as Record<string, never>[]) ?? []).map((p) => ({
        SKU: p.sku, Name: p.name, Category: p.category, Subtype: p.subcategory ?? "",
        Price: Number(p.price), Stock: p.stock, Material: p.material ?? "", Featured: p.featured ? "Yes" : "No",
      })));
      addSheet("Transactions", (((txnRes.data ?? []) as unknown as Record<string, never>[]) ?? []).map((t) => ({
        Serial: t.serial_number, Date: String(t.occurred_at).slice(0, 10), Customer: custName(t.customers as Join),
        Order: ordNo(t.orders as Join), Mode: t.payment_mode, Ref: t.payment_ref,
        Amount: Number(t.amount), Currency: t.currency,
      })));
      addSheet("Shipments", (((shipRes.data ?? []) as unknown as Record<string, never>[]) ?? []).map((s) => ({
        Tracking: s.tracking_number, Carrier: s.carrier ?? "", Recipient: s.recipient_name ?? "",
        Order: ordNo(s.orders as Join), City: s.destination_city ?? "", Address: s.address ?? "",
        Status: s.status, "Est. Delivery": s.estimated_delivery ?? "",
      })));
      addSheet("Activity", (((actRes.data ?? []) as unknown as Record<string, never>[]) ?? []).map((a) => ({
        When: String(a.created_at).replace("T", " ").slice(0, 16), Actor: a.actor_name, Action: a.action,
        Type: a.entity_type, Label: a.entity_label, Customer: a.customer_name ?? "",
        Order: a.order_number ?? "", Detail: a.detail ?? "",
      })));

      XLSX.writeFile(wb, `varnika-full-backup-${stamp}.xlsx`);
    } finally {
      setExporting(false);
    }
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

          <Card className="p-5 space-y-3 md:col-span-3 border-black">
            <h3 className="text-sm font-semibold text-black">
              Full Backup (Excel)
            </h3>
            <p className="text-xs text-neutral-500">
              Everything in one spreadsheet — Orders, Items, Customers, Products, Transactions, Shipments, Activity (latest 2,000).
            </p>
            <Button variant="default" size="sm" className="w-full text-xs gap-1.5" disabled={exporting} onClick={exportFullExcel}>
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{exporting ? "Building…" : "Download Full Excel"}</span>
            </Button>
          </Card>
        </div>
      </div>
    </RouteGuard>
  );
}
