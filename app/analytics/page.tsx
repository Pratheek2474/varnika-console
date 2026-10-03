"use client";

import React, { useEffect, useState } from "react";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CardsListSkeleton } from "@/components/ui/page-skeletons";
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
import { formatCurrency } from "@/lib/utils";
import {
  getCustomerStats,
  getOrderStats,
  getRevenueStats,
} from "@/lib/supabase/stats";

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  active: "Active",
  hold: "Hold",
  dispatched: "Dispatched",
  delivered: "Delivered",
};

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [byStatus, setByStatus] = useState<{ stage: string; count: number }[]>([]);
  const [byMonth, setByMonth] = useState<{ month: string; revenue: number }[]>([]);
  const [topCustomers, setTopCustomers] = useState<{ name: string; total: number }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [ord, rev, cust] = await Promise.all([
          getOrderStats(1000),
          getRevenueStats(6),
          getCustomerStats(),
        ]);
        setByStatus(
          ord.byStatus.map((s) => ({
            stage: STATUS_LABELS[s.status] ?? s.status,
            count: s.count,
          }))
        );
        setByMonth(rev.byMonth.map((b) => ({ month: b.label, revenue: b.revenue })));
        setTopCustomers(cust.top);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <CardsListSkeleton cards={3} />;

  return (
    <RouteGuard
      requiredPermission="analytics.read"
      requiredFeature="analytics"
      moduleName="Analytics"
    >
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#E6E3DB]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">
              Analytics & Trends
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Live pipeline volume, collected revenue, and top clients.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Orders by Stage</CardTitle>
              <CardDescription>Live pipeline distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={byStatus}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
                  >
                    <XAxis type="number" stroke="#A3A3A3" fontSize={11} tickLine={false} allowDecimals={false} />
                    <YAxis dataKey="stage" type="category" stroke="#A3A3A3" fontSize={11} tickLine={false} width={130} />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-black text-white p-2.5 text-xs border border-neutral-800 rounded-xs">
                              <span>{payload[0].payload.stage}: {payload[0].value}</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" fill="#141414" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by Month</CardTitle>
              <CardDescription>Collected revenue, last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={byMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="anaAreaMono" x1="0" y1="0" x2="0" y2="1">
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
                              <span>{formatCurrency(payload[0].value as number)}</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#141414" strokeWidth={2} fill="url(#anaAreaMono)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Clients by Spend</CardTitle>
            <CardDescription>Lifetime order value, top 5</CardDescription>
          </CardHeader>
          <CardContent>
            {topCustomers.length === 0 ? (
              <div className="text-center py-8 text-xs text-neutral-400">
                No clients yet.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topCustomers}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
                  >
                    <XAxis type="number" stroke="#A3A3A3" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                    <YAxis dataKey="name" type="category" stroke="#A3A3A3" fontSize={11} tickLine={false} width={130} />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-black text-white p-2.5 text-xs border border-neutral-800 rounded-xs">
                              <span>{payload[0].payload.name}: {formatCurrency(payload[0].value as number)}</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="total" fill="#141414" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  );
}
