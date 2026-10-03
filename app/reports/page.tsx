"use client";

import React from "react";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function ReportsPage() {
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
              Quarterly accounting records, inventory audits, and exportable statements.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 space-y-3">
            <h3 className="text-sm font-semibold text-black">
              Q3 Atelier Financial Statement
            </h3>
            <p className="text-xs text-neutral-500">
              Complete transaction and revenue ledger.
            </p>
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
              <Download className="w-3.5 h-3.5" />
              <span>Download XLSX</span>
            </Button>
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="text-sm font-semibold text-black">
              Textile & Inventory Valuation
            </h3>
            <p className="text-xs text-neutral-500">
              Material audit for cashmere, silk, and hardware.
            </p>
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </Button>
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="text-sm font-semibold text-black">
              VIP Patron Spending Summary
            </h3>
            <p className="text-xs text-neutral-500">
              Patron tier metrics and repeat order frequency.
            </p>
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </Button>
          </Card>
        </div>
      </div>
    </RouteGuard>
  );
}
