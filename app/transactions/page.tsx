"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { useAuth } from "@/lib/context/auth-context";
import { TransactionWithLinks } from "@/lib/supabase/database.types";
import {
  createTransaction,
  listTransactions,
  updateTransaction,
  TransactionInput,
} from "@/lib/supabase/queries-ops";
import { listCustomers } from "@/lib/supabase/queries-customers";
import { listOrders } from "@/lib/supabase/queries-orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableListSkeleton } from "@/components/ui/page-skeletons";
import { Search, ExternalLink, Plus, Pencil } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TransactionFormDialog } from "@/components/forms/TransactionFormDialog";
import { useActor } from "@/lib/context/actor-context";
import { logActivity } from "@/lib/supabase/activity";

const PAYMENT_MODE_LABELS: Record<string, string> = {
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  upi: "UPI",
  bank_transfer: "Bank Transfer",
  cash: "Cash",
};

export default function TransactionsPage() {
  const { permissions } = useAuth();
  const { actor } = useActor();
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState<TransactionWithLinks[]>([]);
  const [customerOptions, setCustomerOptions] = useState<{ id: string; customer_name: string }[]>([]);
  const [orderOptions, setOrderOptions] = useState<{ id: string; order_number: string; customer_id: string | null; total: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionWithLinks | null>(null);

  const showRevenue = permissions.includes("revenue.read");
  const canWrite = permissions.includes("transactions.write");

  const refresh = async () => {
    setLoading(true);
    try {
      setLoadError(null);
      const [txns, custs, ords] = await Promise.all([
        listTransactions(),
        listCustomers(),
        listOrders(),
      ]);
      setTransactions(txns);
      setCustomerOptions(custs.map((c) => ({ id: c.id, customer_name: c.customer_name })));
      setOrderOptions(
        ords.map((o) => ({
          id: o.id,
          order_number: o.order_number,
          customer_id: o.customer_id,
          total: Number(o.total),
        }))
      );
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filteredTransactions = transactions.filter(
    (t) =>
      (t.customers?.customer_name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.orders?.order_number ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.payment_ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.payment_mode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async (values: TransactionInput) => {
    const customerName =
      customerOptions.find((c) => c.id === values.customer_id)?.customer_name ?? "";
    const orderNumber =
      orderOptions.find((o) => o.id === values.order_id)?.order_number ?? "";
    if (editing) {
      await updateTransaction(editing.id, values);
      await logActivity({
        actor,
        action: "edited",
        entityType: "transaction",
        entityId: editing.id,
        entityLabel: values.payment_ref,
        customerId: values.customer_id,
        customerName,
        orderId: values.order_id,
        orderNumber,
      });
      setEditing(null);
    } else {
      const created = await createTransaction(values);
      await logActivity({
        actor,
        action: "added",
        entityType: "transaction",
        entityId: created.id,
        entityLabel: values.payment_ref,
        detail: `${values.amount} USD`,
        customerId: values.customer_id,
        customerName,
        orderId: values.order_id,
        orderNumber,
      });
    }
    await refresh();
  };

  if (loading) return <TableListSkeleton rows={8} cols={6} />;

  return (
    <RouteGuard requiredPermission="transactions.read" moduleName="Transactions">
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#E6E3DB]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">
              Transactions
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Payment records, transaction references, and settlement log.
            </p>
          </div>
          {canWrite && (
            <Button variant="default" size="sm" className="h-8 text-xs shrink-0" onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Transaction
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
              placeholder="Search by customer, order, payment ref..."
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
                <th className="py-3.5 px-4">S.No</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4">Order</th>
                <th className="py-3.5 px-4">Payment Mode</th>
                <th className="py-3.5 px-4">Payment Ref</th>
                <th className="py-3.5 px-4">Date</th>
                {canWrite && <th className="py-3.5 px-4 text-center">Edit</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE1]">
              {filteredTransactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-[#FAF9F6] transition-colors">
                  <td className="py-3 px-4 font-mono text-neutral-500">
                    {String(txn.serial_number).padStart(3, "0")}
                  </td>
                  <td className="py-3 px-4">
                    {txn.customers ? (
                      <Link
                        href={`/customers/${txn.customers.id}`}
                        className="font-medium text-black hover:underline inline-flex items-center gap-1"
                      >
                        {txn.customers.customer_name}
                        <ExternalLink className="w-3 h-3 text-neutral-400" />
                      </Link>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-black">
                    {showRevenue ? formatCurrency(Number(txn.amount), txn.currency) : "—"}
                  </td>
                  <td className="py-3 px-4">
                    {txn.orders ? (
                      <Link
                        href={`/orders/${txn.order_id}`}
                        className="font-mono text-xs text-black hover:underline inline-flex items-center gap-1"
                      >
                        {txn.orders.order_number}
                        <ExternalLink className="w-3 h-3 text-neutral-400" />
                      </Link>
                    ) : (
                      <span className="text-neutral-400 font-mono text-xs">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="secondary" className="text-[10px]">
                      {PAYMENT_MODE_LABELS[txn.payment_mode] || txn.payment_mode}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-neutral-600">
                    {txn.payment_ref}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-neutral-500">
                    {formatDate(txn.occurred_at)}
                  </td>
                  {canWrite && (
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => { setEditing(txn); setFormOpen(true); }}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-xs border border-[#E6E3DB] hover:border-black hover:bg-[#F4F2ED] transition-colors"
                        title="Edit transaction"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTransactions.length === 0 && !loadError && (
            <div className="text-center py-12 text-xs text-neutral-400">
              No transactions found.
            </div>
          )}
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden space-y-3">
          {filteredTransactions.map((txn) => (
            <div
              key={txn.id}
              className="p-4 bg-white border border-[#E6E3DB] rounded-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-neutral-400">
                  #{String(txn.serial_number).padStart(3, "0")}
                </span>
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px]">
                    {PAYMENT_MODE_LABELS[txn.payment_mode] || txn.payment_mode}
                  </Badge>
                  {canWrite && (
                    <button
                      onClick={() => { setEditing(txn); setFormOpen(true); }}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-xs border border-[#E6E3DB]"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {txn.customers ? (
                  <Link
                    href={`/customers/${txn.customers.id}`}
                    className="text-sm font-medium text-black hover:underline inline-flex items-center gap-1"
                  >
                    {txn.customers.customer_name}
                    <ExternalLink className="w-3 h-3 text-neutral-400" />
                  </Link>
                ) : (
                  <span className="text-sm text-neutral-400">—</span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {txn.orders ? (
                  <Link
                    href={`/orders/${txn.order_id}`}
                    className="font-mono text-xs text-black hover:underline inline-flex items-center gap-1"
                  >
                    {txn.orders.order_number}
                    <ExternalLink className="w-3 h-3 text-neutral-400" />
                  </Link>
                ) : (
                  <span className="font-mono text-xs text-neutral-400">—</span>
                )}
              </div>

              <div className="pt-2 border-t border-[#F0ECE1] flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-neutral-500">
                  {txn.payment_ref}
                </span>
                <div className="text-right">
                  {showRevenue && (
                    <div className="font-semibold text-black font-mono">
                      {formatCurrency(Number(txn.amount), txn.currency)}
                    </div>
                  )}
                  <div className="text-[10px] text-neutral-400 font-mono">
                    {formatDate(txn.occurred_at)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <TransactionFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          initial={editing}
          customers={customerOptions}
          orders={orderOptions}
          onSave={handleSave}
        />
      </div>
    </RouteGuard>
  );
}
