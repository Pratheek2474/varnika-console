"use client";

import React from "react";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

const CONVERSION_DATA = [
  { stage: "Lookbook Visits", count: 45000 },
  { stage: "Garment Views", count: 18200 },
  { stage: "Measurement Checks", count: 4100 },
  { stage: "Consultations", count: 1200 },
  { stage: "Orders Placed", count: 278 },
];

export default function AnalyticsPage() {
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
              Lookbook interest, client purchase funnels, and conversion volume.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Client Journey Funnel</CardTitle>
            <CardDescription>From initial lookbook visit to completed order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={CONVERSION_DATA}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
                >
                  <XAxis type="number" stroke="#A3A3A3" fontSize={11} tickLine={false} />
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
      </div>
    </RouteGuard>
  );
}
