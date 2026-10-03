"use client";

import React from "react";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_REVENUE_CHART } from "@/lib/api/mock-supabase";
import { Download } from "lucide-react";
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

export default function RevenuePage() {
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
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
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
              $112,000
            </div>
            <div className="text-xs text-neutral-400 mt-1 font-mono">
              +18.4% vs previous month
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-xs text-neutral-500">Average Order Value</div>
            <div className="text-2xl sm:text-3xl font-semibold text-black mt-2">
              $385.40
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Bespoke garments
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-xs text-neutral-500">VIP Client Share</div>
            <div className="text-2xl sm:text-3xl font-semibold text-black mt-2">
              68.2%
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Repeat clientele
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-xs text-neutral-500">Operating Margin</div>
            <div className="text-2xl sm:text-3xl font-semibold text-black mt-2">
              34.8%
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Net after materials
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue AreaChart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Revenue Progression</CardTitle>
              <CardDescription>Monthly billing total (USD)</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MOCK_REVENUE_CHART} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

          {/* Category BarChart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Category Attribution</CardTitle>
              <CardDescription>Apparel vs Bags vs Knitwear revenue</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_REVENUE_CHART} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" stroke="#A3A3A3" fontSize={11} tickLine={false} />
                    <YAxis stroke="#A3A3A3" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-black text-white p-2.5 text-xs border border-neutral-800 space-y-1 rounded-xs">
                              {payload.map((entry, index) => (
                                <div key={index}>
                                  {entry.name}: {formatCurrency(entry.value as number)}
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="apparel" fill="#141414" name="Apparel" />
                    <Bar dataKey="bags" fill="#666666" name="Bags" />
                    <Bar dataKey="knitwear" fill="#A3A3A3" name="Knitwear" />
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
            <CardDescription>Merchant transaction captures</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F6] text-neutral-400 font-medium text-[11px] border-b border-[#E6E3DB]">
                  <tr>
                    <th className="py-3.5 px-6">Transaction Ref</th>
                    <th className="py-3.5 px-6">Client</th>
                    <th className="py-3.5 px-6">Payment Method</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Settled Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0ECE1]">
                  <tr className="hover:bg-[#FAF9F6]">
                    <td className="py-4 px-6 font-mono text-black">TXN-991204</td>
                    <td className="py-4 px-6 font-medium text-black">Priya Sharma</td>
                    <td className="py-4 px-6 text-neutral-600 font-mono">AMEX ··4012</td>
                    <td className="py-4 px-6">
                      <Badge variant="outline" className="text-[10px]">Captured</Badge>
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-medium text-black">
                      $420.00
                    </td>
                  </tr>
                  <tr className="hover:bg-[#FAF9F6]">
                    <td className="py-4 px-6 font-mono text-black">TXN-991205</td>
                    <td className="py-4 px-6 font-medium text-black">Eleanor Vance</td>
                    <td className="py-4 px-6 text-neutral-600 font-mono">Wire Transfer</td>
                    <td className="py-4 px-6">
                      <Badge variant="outline" className="text-[10px]">Settled</Badge>
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-medium text-black">
                      $380.00
                    </td>
                  </tr>
                  <tr className="hover:bg-[#FAF9F6]">
                    <td className="py-4 px-6 font-mono text-black">TXN-991206</td>
                    <td className="py-4 px-6 font-medium text-black">Rahul Kapoor</td>
                    <td className="py-4 px-6 text-neutral-600 font-mono">Visa ··8891</td>
                    <td className="py-4 px-6">
                      <Badge variant="outline" className="text-[10px]">Captured</Badge>
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-medium text-black">
                      $360.00
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  );
}
