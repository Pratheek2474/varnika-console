"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { useAuth } from "@/lib/context/auth-context";
import { OrderWithCustomer } from "@/lib/supabase/database.types";
import { listOrders } from "@/lib/supabase/queries-orders";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowLeft, ExternalLink } from "lucide-react";
import { TableListSkeleton } from "@/components/ui/page-skeletons";
import { formatCurrency } from "@/lib/utils";

export default function PastOrdersPage() {
  const { permissions } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState<OrderWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  const showRevenue = permissions.includes("revenue.read");

  useEffect(() => {
    (async () => {
      try {
        setOrders(await listOrders());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const deliveredOrders = orders.filter((o) => o.status === "delivered");

  const filteredOrders = deliveredOrders.filter(
    (o) =>
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customers?.customer_name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.item_summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <TableListSkeleton rows={6} cols={5} />;

  return (
    <RouteGuard requiredPermission="orders.read" moduleName="Orders">
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Back Link */}
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Orders
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#E6E3DB]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">
              Past Orders
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Completed and delivered orders archive.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center bg-white p-3 border border-[#E6E3DB] rounded-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search past orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#FAF9F6] border border-[#E6E3DB] text-xs focus:outline-none focus:border-black rounded-xs"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white border border-[#E6E3DB] rounded-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F6] text-neutral-400 font-medium text-[11px] border-b border-[#E6E3DB]">
              <tr>
                <th className="py-3.5 px-6">Order</th>
                <th className="py-3.5 px-6">Customer</th>
                <th className="py-3.5 px-6">Item</th>
                <th className="py-3.5 px-6 text-right">Amount</th>
                <th className="py-3.5 px-6">Delivered</th>
                <th className="py-3.5 px-6 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE1]">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[#FAF9F6] transition-colors">
                  <td className="py-4 px-6">
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-mono text-xs font-medium text-black hover:underline inline-flex items-center gap-1"
                    >
                      {order.order_number}
                      <ExternalLink className="w-3 h-3 text-neutral-400" />
                    </Link>
                  </td>
                  <td className="py-4 px-6">
                    {order.customers ? (
                      <Link
                        href={`/customers/${order.customers.id}`}
                        className="font-medium text-black hover:underline inline-flex items-center gap-1"
                      >
                        {order.customers.customer_name}
                        <ExternalLink className="w-3 h-3 text-neutral-400" />
                      </Link>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-neutral-600 truncate max-w-[200px]">
                    {order.item_summary}
                  </td>
                  <td className="py-4 px-6 text-right font-mono font-medium text-black">
                    {showRevenue ? formatCurrency(Number(order.total)) : "—"}
                  </td>
                  <td className="py-4 px-6 font-mono text-[11px] text-neutral-500">
                    {order.delivery_date ?? "—"}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <Link href={`/orders/${order.id}`}>
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-xs border border-[#E6E3DB] hover:border-black hover:bg-black hover:text-white transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-xs text-neutral-400">
              No past orders found.
            </div>
          )}
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => router.push(`/orders/${order.id}`)}
              className="p-4 bg-white border border-[#E6E3DB] hover:border-black/40 transition-colors rounded-xs block cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-medium text-black">
                  {order.order_number}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  delivered
                </Badge>
              </div>
              <div className="text-xs text-neutral-600 truncate mb-1">
                {order.item_summary}
              </div>
              <div className="flex items-center justify-between text-[11px]">
                {order.customers ? (
                  <Link
                    href={`/customers/${order.customers.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-neutral-500 hover:text-black hover:underline font-mono inline-flex items-center gap-1"
                  >
                    {order.customers.customer_name}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                ) : (
                  <span className="text-neutral-400 font-mono">—</span>
                )}
                <div className="text-right font-mono">
                  {showRevenue && (
                    <span className="font-medium text-black">
                      {formatCurrency(Number(order.total))}
                    </span>
                  )}
                  <span className="text-neutral-400 ml-2">
                    {order.delivery_date ?? ""}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-xs text-neutral-400">
              No past orders found.
            </div>
          )}
        </div>
      </div>
    </RouteGuard>
  );
}
