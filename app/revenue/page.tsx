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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { downloadCsv, formatCurrency } from "@/lib/utils";
import { getRevenueStats, RevenueStats } from "@/lib/supabase/stats";
import { listTransactions } from "@/lib/supabase/queries-ops";
import { TransactionWithLinks } from "@/lib/supabase/database.types";

const MODE_LABELS: Record<string, string> = {
  upi: "UPI",
  cash: "Cash",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  bank_transfer: "Bank Transfer",
};

export default function RevenuePage() {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [txns, setTxns] = useState<TransactionWithLinks[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, t] = await Promise.all([getRevenueStats(6), listTransactions()]);
        setStats(s);
        setTxns(t.slice(0, 10));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const exportLedger = () => {
    downloadCsv(
      "transactions-ledger.csv",
      ["Serial", "Date", "Customer", "Order", "Mode", "Reference", "Amount"],
      txns.map((t) => [
        t.serial_number,
        new Date(t.occurred_at).toLocaleDateString(),
        t.customers?.customer_name ?? "",
        t.orders?.order_number ?? "",
        MODE_LABELS[t.payment_mode] ?? t.payment_mode,
        t.payment_ref,
        Number(t.amount),
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#E6E3DB]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">
              Revenue & Ledger
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Financial performance, gross revenue volume, and transaction settlement records.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={exportLedger}>
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="text-xs text-neutral-500">Gross Revenue</div>
            <div className="text-2xl sm:text-3xl font-semibold text-black mt-2">
              {formatCurrency(stats?.gross ?? 0)}
            </div>
            <div className="text-xs text-neutral-400 mt-1 font-mono">
              {stats?.count ?? 0} transactions
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-xs text-neutral-500">Average Order Value</div>
            <div className="text-2xl sm:text-3xl font-semibold text-black mt-2">
              {formatCurrency(stats?.avg ?? 0)}
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Per transaction
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-xs text-neutral-500">Collected This Month</div>
            <div className="text-2xl sm:text-3xl font-semibold text-black mt-2">
              {formatCurrency(stats?.thisMonth ?? 0)}
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Current calendar month
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-xs text-neutral-500">Transactions</div>
            <div className="text-2xl sm:text-3xl font-semibold text-black mt-2">
              {stats?.count ?? 0}
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              All time
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue AreaChart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Revenue Progression</CardTitle>
              <CardDescription>Monthly collected total (USD)</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.byMonth.map((b) => ({ month: b.label, revenue: b.revenue })) ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revAreaMono" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#141414" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#141414" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#A3A3A3" fontSize={11} tickLine={false} />
                    <YAxis stroke="#A3A3A3" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-black text-white p-2.5 text-xs border border-neutral-800 rounded-xs">
                              <span className="font-medium">
                                {formatCurrency(payload[0].value as number)}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#141414" strokeWidth={2} fill="url(#revAreaMono)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Payment Mode BarChart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Payment Mode Split</CardTitle>
              <CardDescription>Collected volume by payment method</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(stats?.byMode ?? []).map((m) => ({ mode: MODE_LABELS[m.mode] ?? m.mode, total: m.total }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="mode" stroke="#A3A3A3" fontSize={11} tickLine={false} />
                    <YAxis stroke="#A3A3A3" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-black text-white p-2.5 text-xs border border-neutral-800 space-y-1 rounded-xs">
                              <div>{payload[0].payload.mode}: {formatCurrency(payload[0].value as number)}</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="total" fill="#141414" name="Total" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ledger Table */}
        <Card>
          <CardHeader>
            <CardTitle>Settlement Records</CardTitle>
            <CardDescription>Latest merchant transaction captures</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {txns.length === 0 ? (
              <div className="text-center py-12 text-xs text-neutral-400">
                No transactions yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF9F6] text-neutral-400 font-medium text-[11px] border-b border-[#E6E3DB]">
                    <tr>
                      <th className="py-3.5 px-6">Transaction Ref</th>
                      <th className="py-3.5 px-6">Client</th>
                      <th className="py-3.5 px-6">Order</th>
                      <th className="py-3.5 px-6">Payment Method</th>
                      <th className="py-3.5 px-6 text-right">Settled Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0ECE1]">
                    {txns.map((t) => (
                      <tr key={t.id} className="hover:bg-[#FAF9F6]">
                        <td className="py-4 px-6 font-mono text-black">{t.payment_ref}</td>
                        <td className="py-4 px-6 font-medium text-black">
                          {t.customers ? (
                            <Link href={`/customers/${t.customers.id}`} className="hover:underline inline-flex items-center gap-1">
                              {t.customers.customer_name}
                              <ExternalLink className="w-3 h-3 text-neutral-400" />
                            </Link>
                          ) : "—"}
                        </td>
                        <td className="py-4 px-6 font-mono">
                          {t.orders ? (
                            <Link href={`/orders/${t.order_id}`} className="hover:underline inline-flex items-center gap-1">
                              {t.orders.order_number}
                              <ExternalLink className="w-3 h-3 text-neutral-400" />
                            </Link>
                          ) : "—"}
                        </td>
                        <td className="py-4 px-6 text-neutral-600">
                          <Badge variant="outline" className="text-[10px]">
                            {MODE_LABELS[t.payment_mode] ?? t.payment_mode}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-medium text-black">
                          {formatCurrency(Number(t.amount), t.currency)}
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
