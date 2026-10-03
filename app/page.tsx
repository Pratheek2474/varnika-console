"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/auth-context";
import { useFeatureFlags } from "@/lib/context/feature-flags-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardsListSkeleton } from "@/components/ui/page-skeletons";
import { ArrowRight } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import {
  getCustomerStats,
  getOpenChatsCount,
  getOrderStats,
  getRevenueStats,
  OrderStatRow,
} from "@/lib/supabase/stats";

export default function HomePage() {
  const { permissions } = useAuth();
  const { flags } = useFeatureFlags();
  const [loading, setLoading] = useState(true);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [txnCount, setTxnCount] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [clientsWithOrders, setClientsWithOrders] = useState(0);
  const [openChats, setOpenChats] = useState(0);
  const [chartData, setChartData] = useState<{ month: string; revenue: number; orders: number }[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderStatRow[]>([]);

  const showRevenue = permissions.includes("revenue.read") && flags.revenue;

  useEffect(() => {
    (async () => {
      try {
        const [rev, ord, cust, chats] = await Promise.all([
          getRevenueStats(6),
          getOrderStats(5),
          getCustomerStats(),
          getOpenChatsCount(),
        ]);
        setMonthRevenue(rev.thisMonth);
        setTxnCount(rev.count);
        setActiveOrders(ord.active);
        setTotalOrders(ord.total);
        setTotalClients(cust.total);
        setClientsWithOrders(cust.withOrders);
        setOpenChats(chats);
        setChartData(
          rev.byMonth.map((b) => ({ month: b.label, revenue: b.revenue, orders: b.count }))
        );
        setRecentOrders(ord.recent);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <CardsListSkeleton cards={4} />;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#E6E3DB]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">
            Overview
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Real-time atelier activity, client orders, and performance summary.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/orders" className="text-xs gap-1.5">
              <span>View Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <Card className="p-5">
          <div className="text-xs text-neutral-500 font-normal">
            Monthly Revenue
          </div>
          {showRevenue ? (
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">
                {formatCurrency(monthRevenue)}
              </div>
              <div className="text-xs text-neutral-400 mt-1 font-mono">
                {txnCount} transactions total
              </div>
            </div>
          ) : (
            <div className="mt-2">
              <div className="text-base text-neutral-400 italic">
                Restricted
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                Admin permission required
              </div>
            </div>
          )}
        </Card>

        {/* Active Orders */}
        <Card className="p-5">
          <div className="text-xs text-neutral-500 font-normal">
            Active Orders
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">
              {activeOrders}
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              {totalOrders} orders total
            </div>
          </div>
        </Card>

        {/* Total Patrons */}
        <Card className="p-5">
          <div className="text-xs text-neutral-500 font-normal">
            Total Clients
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">
              {totalClients}
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              {clientsWithOrders} with orders
            </div>
          </div>
        </Card>

        {/* Open Chats */}
        <Card className="p-5">
          <div className="text-xs text-neutral-500 font-normal">
            Open Chats
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">
              {openChats}
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              <Link href="/chat" className="underline underline-offset-2 hover:text-black">
                Go to chat
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Chart Section */}
      {showRevenue && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Revenue Growth</CardTitle>
            <CardDescription>
              Monthly collected revenue across the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="monochromeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#141414" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#141414" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    stroke="#A3A3A3"
                    fontSize={11}
                  />
                  <YAxis
                    tickLine={false}
                    stroke="#A3A3A3"
                    fontSize={11}
                    tickFormatter={(val) => `$${val / 1000}k`}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-black text-white p-2.5 text-xs shadow-md border border-neutral-800 rounded-xs">
                            <div className="font-medium">{data.month}</div>
                            <div className="mt-1 font-mono">
                              Revenue: {formatCurrency(data.revenue)}
                            </div>
                            <div className="text-neutral-400 text-[10px]">
                              Transactions: {data.orders}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#141414"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#monochromeGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Latest orders placed by clients
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/orders" className="text-xs text-neutral-600 hover:text-black gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {recentOrders.length === 0 ? (
            <div className="text-center py-12 text-xs text-neutral-400">
              No orders yet.
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF9F6] text-neutral-400 font-medium text-[11px] border-b border-[#E6E3DB]">
                    <tr>
                      <th className="py-3.5 px-6">Order ID</th>
                      <th className="py-3.5 px-6">Client</th>
                      <th className="py-3.5 px-6">Garment</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Amount</th>
                      <th className="py-3.5 px-6 text-right">Delivery</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0ECE1]">
                    {recentOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#FAF9F6] transition-colors">
                        <td className="py-4 px-6 font-mono text-black">
                          {ord.order_number}
                        </td>
                        <td className="py-4 px-6 font-medium text-black">
                          {ord.customers?.customer_name ?? "—"}
                        </td>
                        <td className="py-4 px-6 text-neutral-600 truncate max-w-xs">
                          {ord.item_summary}
                        </td>
                        <td className="py-4 px-6">
                          <span className="capitalize px-2 py-0.5 text-[11px] border border-[#E6E3DB] bg-[#F7F5F0] text-neutral-800 rounded-xs">
                            {ord.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-black">
                          {permissions.includes("revenue.read")
                            ? formatCurrency(Number(ord.total))
                            : "—"}
                        </td>
                        <td className="py-4 px-6 text-right text-neutral-500 font-mono text-[11px]">
                          {ord.delivery_date ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List (Ergonomic cards) */}
              <div className="md:hidden divide-y divide-[#F0ECE1]">
                {recentOrders.map((ord) => (
                  <div key={ord.id} className="p-4 space-y-2 active:bg-[#FAF9F6]">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-black">
                        {ord.order_number}
                      </span>
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {ord.status.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <div className="text-xs font-medium text-black">
                      {ord.customers?.customer_name ?? "—"}
                    </div>

                    <div className="text-xs text-neutral-500">
                      {ord.item_summary}
                    </div>

                    <div className="flex items-center justify-between text-xs text-neutral-400 pt-1 font-mono">
                      <span>Due: {ord.delivery_date ?? "—"}</span>
                      {permissions.includes("revenue.read") && (
                        <span className="text-black font-medium">
                          {formatCurrency(Number(ord.total))}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
