"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardsListSkeleton } from "@/components/ui/page-skeletons";
import { Download, ExternalLink } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { downloadCsv, formatCurrency, formatDate } from "@/lib/utils";
import { getRevenueStats, RevenueStats } from "@/lib/supabase/stats";
import { supabase } from "@/lib/supabase/client";

interface PaidOrder {
  id: string;
  order_number: string;
  total: number;
  paid_at: string | null;
  created_at: string;
  customers: { id: string; customer_name: string } | null;
}

export default function RevenuePage() {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [paidOrders, setPaidOrders] = useState<PaidOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, res] = await Promise.all([
          getRevenueStats(6),
          supabase
            .from("orders")
            .select("id,order_number,total,paid_at,created_at,customers(id,customer_name)")
            .eq("is_paid", true)
            .order("paid_at", { ascending: false, nullsFirst: false })
            .limit(25),
        ]);
        setStats(s);
        setPaidOrders(
          ((res.data ?? []) as unknown as (Omit<PaidOrder, "customers"> & {
            customers: PaidOrder["customers"] | PaidOrder["customers"][];
          })[]).map((o) => ({
            ...o,
            customers: Array.isArray(o.customers) ? (o.customers[0] ?? null) : o.customers,
          }))
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const exportPaid = () => {
    downloadCsv(
      "paid-orders.csv",
      ["Order", "Customer", "Paid on", "Amount"],
      paidOrders.map((o) => [
        o.order_number,
        o.customers?.customer_name ?? "",
        new Date(o.paid_at ?? o.created_at).toLocaleDateString(),
        Number(o.total),
      ])
    );
  };

  if (loading) return <CardsListSkeleton cards={4} />;

  return (
    <RouteGuard
      requiredPermission="revenue.read"
      requiredFeature="revenue"
      moduleName="Revenue"
    >
      <div className="space-y-8 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-line">
          <div>
            <h1 className="text-2xl sm:text-3xl">Revenue</h1>
            <p className="text-xs text-neutral-500 mt-1">
              Revenue counts orders marked as paid. Mark an order paid from its page or the orders board.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={exportPaid}>
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="text-xs text-neutral-500">Collected</div>
            <div className="text-2xl sm:text-3xl font-semibold text-black mt-2">
              {formatCurrency(stats?.gross ?? 0)}
            </div>
            <div className="text-xs text-neutral-400 mt-1 font-mono">{stats?.count ?? 0} paid orders</div>
          </Card>
          <Card className="p-5">
            <div className="text-xs text-neutral-500">Collected This Month</div>
            <div className="text-2xl sm:text-3xl font-semibold text-black mt-2">
              {formatCurrency(stats?.thisMonth ?? 0)}
            </div>
            <div className="text-xs text-neutral-400 mt-1">Current calendar month</div>
          </Card>
          <Card className="p-5">
            <div className="text-xs text-neutral-500">Outstanding</div>
            <div className="text-2xl sm:text-3xl font-semibold text-black mt-2">
              {formatCurrency(stats?.outstanding ?? 0)}
            </div>
            <div className="text-xs text-neutral-400 mt-1 font-mono">{stats?.unpaidCount ?? 0} unpaid orders</div>
          </Card>
          <Card className="p-5">
            <div className="text-xs text-neutral-500">Average Order Value</div>
            <div className="text-2xl sm:text-3xl font-semibold text-black mt-2">
              {formatCurrency(stats?.avg ?? 0)}
            </div>
            <div className="text-xs text-neutral-400 mt-1">Per paid order</div>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Revenue Progression</CardTitle>
            <CardDescription>Paid orders by month (₹)</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.byMonth.map((b) => ({ month: b.label, revenue: b.revenue })) ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revAreaMono" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4A0E19" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4A0E19" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#A39B93" fontSize={11} tickLine={false} />
                  <YAxis stroke="#A39B93" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-ink text-white p-2.5 text-xs border border-ink rounded-xs">
                            <span className="font-medium">{formatCurrency(payload[0].value as number)}</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#4A0E19" strokeWidth={2} fill="url(#revAreaMono)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paid Orders</CardTitle>
            <CardDescription>Most recently paid first</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {paidOrders.length === 0 ? (
              <div className="text-center py-12 text-xs text-neutral-400">No paid orders yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-ivory text-neutral-400 font-medium text-[11px] border-b border-line">
                    <tr>
                      <th className="py-3.5 px-6">Order</th>
                      <th className="py-3.5 px-6">Client</th>
                      <th className="py-3.5 px-6">Paid On</th>
                      <th className="py-3.5 px-6 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-soft">
                    {paidOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-ivory">
                        <td className="py-4 px-6 font-mono">
                          <Link href={`/orders/${o.id}`} className="hover:underline inline-flex items-center gap-1 text-black">
                            {o.order_number}
                            <ExternalLink className="w-3 h-3 text-neutral-400" />
                          </Link>
                        </td>
                        <td className="py-4 px-6 font-medium text-black">
                          {o.customers ? (
                            <Link href={`/customers/${o.customers.id}`} className="hover:underline">
                              {o.customers.customer_name}
                            </Link>
                          ) : "—"}
                        </td>
                        <td className="py-4 px-6 text-neutral-600">
                          <Badge variant="outline" className="text-[10px]">
                            {formatDate(o.paid_at ?? o.created_at)}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-medium text-black">
                          {formatCurrency(Number(o.total))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  );
}
