"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { useAuth } from "@/lib/context/auth-context";
import { CustomerWithMeasurement } from "@/lib/supabase/database.types";
import {
  createCustomer,
  listCustomers,
  updateCustomer,
} from "@/lib/supabase/queries-customers";
import { CustomerInput } from "@/lib/supabase/queries-customers";
import { Button } from "@/components/ui/button";
import { TableListSkeleton } from "@/components/ui/page-skeletons";
import { Search, ChevronRight, Plus, Pencil } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CustomerFormDialog } from "@/components/forms/CustomerFormDialog";

export default function CustomersPage() {
  const { permissions } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<CustomerWithMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerWithMeasurement | null>(null);

  const canWrite = permissions.includes("customers.write");

  const refresh = async () => {
    try {
      setLoadError(null);
      const rows = await listCustomers();
      setCustomers(rows);
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filteredCustomers = customers.filter((c) =>
    c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async (values: CustomerInput) => {
    if (editing) {
      const updated = await updateCustomer(
        editing.id,
        {
          customer_name: values.customer_name,
          email: values.email,
          phone: values.phone,
          avatar_url: values.avatar_url,
          special_notes: values.special_notes,
          measurement_id: editing.measurement_id,
        },
        values.measurement
      );
      setCustomers((prev) => prev.map((c) => (c.id === editing.id ? updated : c)));
      setEditing(null);
    } else {
      const created = await createCustomer(values);
      setCustomers((prev) =>
        [...prev, created].sort((a, b) => a.customer_name.localeCompare(b.customer_name))
      );
    }
  };

  if (loading) return <TableListSkeleton rows={6} cols={5} />;

  return (
    <RouteGuard
      requiredPermission="customers.read"
      moduleName="Customers"
    >
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#E6E3DB]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">
              Customers
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Client profiles, order histories, and bespoke tailoring measurements.
            </p>
          </div>
          {canWrite && (
            <Button variant="default" size="sm" className="h-8 text-xs shrink-0" onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Customer
            </Button>
          )}
        </div>

        {loadError && (
          <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xs">
            {loadError}{" "}
            <button onClick={refresh} className="underline font-medium">Retry</button>
          </div>
        )}

        {/* Search */}
        <div className="flex items-center bg-white p-3 border border-[#E6E3DB] rounded-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by client name or email..."
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
                <th className="py-3.5 px-6">Client Name</th>
                <th className="py-3.5 px-6">Orders</th>
                <th className="py-3.5 px-6 text-right">Total Spend</th>
                <th className="py-3.5 px-6 text-right">Last Order</th>
                <th className="py-3.5 px-6 text-center">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE1]">
              {filteredCustomers.map((cust) => (
                <tr
                  key={cust.id}
                  className="hover:bg-[#FAF9F6] transition-colors"
                >
                  <td className="py-4 px-6">
                    <Link href={`/customers/${cust.id}`} className="flex items-center gap-3 group">
                      <div className="w-8 h-8 rounded-full overflow-hidden relative shrink-0 border border-[#E6E3DB]">
                        {cust.avatar_url ? (
                          <Image src={cust.avatar_url} alt={cust.customer_name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#F4F2ED] flex items-center justify-center text-xs font-medium text-neutral-500">
                            {cust.customer_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-black group-hover:underline">
                          {cust.customer_name}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          {cust.email}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="py-4 px-6 font-mono text-neutral-700">
                    <Link href={`/customers/${cust.id}`}>
                      {cust.orders_count}
                    </Link>
                  </td>
                  <td className="py-4 px-6 text-right font-mono font-medium text-black">
                    <Link href={`/customers/${cust.id}`}>
                      {permissions.includes("revenue.read")
                        ? formatCurrency(Number(cust.total_spent))
                        : "—"}
                    </Link>
                  </td>
                  <td className="py-4 px-6 text-right text-neutral-500 font-mono text-[11px]">
                    <Link href={`/customers/${cust.id}`}>
                      {cust.last_order_at ? formatDate(cust.last_order_at) : "—"}
                    </Link>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {canWrite && (
                        <button
                          onClick={() => { setEditing(cust); setFormOpen(true); }}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-xs border border-[#E6E3DB] hover:border-black hover:bg-[#F4F2ED] transition-colors"
                          title="Edit customer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <Link href={`/customers/${cust.id}`}>
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-xs border border-[#E6E3DB] hover:border-black hover:bg-black hover:text-white transition-colors">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCustomers.length === 0 && !loadError && (
            <div className="text-center py-12 text-xs text-neutral-400">
              No customers found. {canWrite && "Add your first customer above."}
            </div>
          )}
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden space-y-3">
          {filteredCustomers.map((cust) => (
            <div key={cust.id} className="p-4 bg-white border border-[#E6E3DB] rounded-xs">
              <Link
                href={`/customers/${cust.id}`}
                className="active:bg-[#FAF9F6] transition-colors flex items-center justify-between"
              >
                <div className="space-y-1.5 min-w-0 pr-3">
                  <h3 className="text-sm font-medium text-black truncate">
                    {cust.customer_name}
                  </h3>

                  <div className="text-xs text-neutral-600 font-mono">
                    {cust.orders_count} orders
                    {permissions.includes("revenue.read") && ` · ${formatCurrency(Number(cust.total_spent))}`}
                  </div>

                  <div className="text-[11px] text-neutral-400">
                    Last order · {cust.last_order_at ? formatDate(cust.last_order_at) : "—"}
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-neutral-300 shrink-0" />
              </Link>
              {canWrite && (
                <div className="pt-3 mt-1 border-t border-[#F0ECE1]">
                  <Button variant="outline" size="sm" className="w-full h-7 text-[11px]" onClick={() => { setEditing(cust); setFormOpen(true); }}>
                    <Pencil className="w-3 h-3 mr-1.5" />
                    Edit
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        <CustomerFormDialog open={formOpen} onOpenChange={setFormOpen} initial={editing} onSave={handleSave} />
      </div>
    </RouteGuard>
  );
}
