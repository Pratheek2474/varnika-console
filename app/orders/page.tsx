"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { useAuth } from "@/lib/context/auth-context";
import { OrderWithCustomer } from "@/lib/supabase/database.types";
import {
  createOrder,
  listOrders,
  updateOrder,
} from "@/lib/supabase/queries-orders";
import { OrderInput } from "@/lib/supabase/queries-orders";
import { listCustomers } from "@/lib/supabase/queries-customers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TableListSkeleton } from "@/components/ui/page-skeletons";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
  type KanbanCommitMeta,
} from "@/components/reui/kanban";
import { Kanban as KanbanIcon, List, Search, ExternalLink, History, Plus, Pencil } from "lucide-react";
import { OrderFormDialog } from "@/components/forms/OrderFormDialog";
import { useActor } from "@/lib/context/actor-context";
import { logActivity } from "@/lib/supabase/activity";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

type Status = OrderWithCustomer["status"];

const PIPELINE_COLUMNS: { key: Status; label: string; dot: string }[] = [
  { key: "new", label: "New", dot: "bg-neutral-300" },
  { key: "active", label: "Active", dot: "bg-blue-500" },
  { key: "hold", label: "Hold", dot: "bg-yellow-500" },
  { key: "dispatched", label: "Dispatched", dot: "bg-violet-500" },
  { key: "delivered", label: "Delivered", dot: "bg-green-600" },
];

function flattenColumns(board: Record<string, OrderWithCustomer[]>): OrderWithCustomer[] {
  return PIPELINE_COLUMNS.flatMap((c) => board[c.key] ?? []);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { permissions } = useAuth();
  const { actor } = useActor();
  const [viewMode, setViewMode] = useState<"kanban" | "tickets">("kanban");
  const [orders, setOrders] = useState<OrderWithCustomer[]>([]);
  const [customerOptions, setCustomerOptions] = useState<{ id: string; customer_name: string }[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<OrderWithCustomer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OrderWithCustomer | null>(null);
  const draggingRef = useRef(false);

  const showRevenue = permissions.includes("revenue.read");
  const canWrite = permissions.includes("orders.write");

  const refresh = async () => {
    try {
      setLoadError(null);
      const [orderRows, customerRows] = await Promise.all([
        listOrders(),
        listCustomers(),
      ]);
      setOrders(orderRows);
      setCustomerOptions(
        customerRows.map((c) => ({ id: c.id, customer_name: c.customer_name }))
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

  const persistStatus = async (
    orderId: string,
    status: Status,
    fromOverride?: string
  ): Promise<boolean> => {
    const current = orders.find((o) => o.id === orderId);
    if (!current || !current.customer_id) return false;
    const from = fromOverride ?? current.status;
    try {
      await updateOrder(orderId, {
        customer_id: current.customer_id,
        item_summary: current.item_summary,
        total: Number(current.total),
        status,
        priority: current.priority,
        delivery_date: current.delivery_date ?? "",
        notes: current.notes,
      });
      await logActivity({
        actor,
        action: "status_changed",
        entityType: "order",
        entityId: orderId,
        entityLabel: current.order_number,
        detail: `from ${from} to ${status}`,
        customerId: current.customers?.id ?? current.customer_id,
        customerName: current.customers?.customer_name ?? "",
        orderId,
        orderNumber: current.order_number,
      });
      return true;
    } catch (e) {
      console.error(e);
      refresh();
      return false;
    }
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customers?.customer_name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.item_summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Board state grouped by status (always contains every column)
  const board = useMemo(() => {
    const grouped: Record<string, OrderWithCustomer[]> = {};
    for (const col of PIPELINE_COLUMNS) {
      grouped[col.key] = filteredOrders.filter((o) => o.status === col.key);
    }
    return grouped;
  }, [filteredOrders]);

  const applyBoard = (next: Record<string, OrderWithCustomer[]>) => {
    setOrders(flattenColumns(next));
  };

  const handleValueCommit = async (
    next: Record<string, OrderWithCustomer[]>,
    meta: KanbanCommitMeta<OrderWithCustomer>
  ) => {
    if (meta.kind !== "item") return;

    // Find the order whose column changed between preview start and drop
    const prevContainerOf = new Map<string, string>();
    for (const [col, items] of Object.entries(meta.previousValue)) {
      for (const item of items) prevContainerOf.set(item.id, col);
    }
    let movedId: string | null = null;
    let to: string | null = null;
    for (const [col, items] of Object.entries(next)) {
      for (const item of items) {
        if (prevContainerOf.get(item.id) !== col) {
          movedId = item.id;
          to = col;
          break;
        }
      }
      if (movedId) break;
    }
    if (!movedId || !to) return; // pure reorder — nothing to persist

    const ok = await persistStatus(movedId, to as Status, prevContainersGet(meta, movedId));
    if (!ok) {
      setOrders(flattenColumns(meta.previousValue));
      toast.error("Could not save move. Board restored.");
    }
  };

  const advanceOrderStatus = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;
    const currentIndex = PIPELINE_COLUMNS.findIndex((col) => col.key === target.status);
    if (currentIndex < PIPELINE_COLUMNS.length - 1) {
      const next = PIPELINE_COLUMNS[currentIndex + 1].key;
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: next } : o))
      );
      await persistStatus(orderId, next);
    }
  };

  const handleSaveOrder = async (values: OrderInput) => {
    if (editing) {
      const updated = await updateOrder(editing.id, values);
      setOrders((prev) => prev.map((o) => (o.id === editing.id ? updated : o)));
      if (selectedTicket?.id === editing.id) setSelectedTicket(updated);
      await logActivity({
        actor,
        action: "edited",
        entityType: "order",
        entityId: editing.id,
        entityLabel: updated.order_number,
        customerId: updated.customers?.id ?? updated.customer_id,
        customerName: updated.customers?.customer_name ?? "",
        orderId: editing.id,
        orderNumber: updated.order_number,
      });
      setEditing(null);
    } else {
      const created = await createOrder(values);
      setOrders((prev) => [created, ...prev]);
      await logActivity({
        actor,
        action: "added",
        entityType: "order",
        entityId: created.id,
        entityLabel: created.order_number,
        customerId: created.customers?.id ?? created.customer_id,
        customerName: created.customers?.customer_name ?? "",
        orderId: created.id,
        orderNumber: created.order_number,
      });
    }
  };

  if (loading) return <TableListSkeleton rows={6} cols={5} />;

  return (
    <RouteGuard requiredPermission="orders.read" requiredFeature="orders_kanban" moduleName="Orders">
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#E6E3DB]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">Orders</h1>
            <p className="text-xs text-neutral-500 mt-1">
              Track garment pipeline stages, client requests, and ticket fulfillment.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canWrite && (
              <Button variant="default" size="sm" className="h-8 text-xs" onClick={() => { setEditing(null); setFormOpen(true); }}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                New Order
              </Button>
            )}
            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
              <Link href="/orders/past">
                <History className="w-3.5 h-3.5 mr-1.5" />
                Past Orders
              </Link>
            </Button>

            <div className="flex items-center bg-[#F4F2ED] border border-[#E6E3DB] p-0.5 rounded-xs">
              <button
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all rounded-xs ${
                  viewMode === "kanban" ? "bg-white text-black shadow-xs" : "text-neutral-500 hover:text-black"
                }`}
              >
                <KanbanIcon className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
              <button
                onClick={() => setViewMode("tickets")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all rounded-xs ${
                  viewMode === "tickets" ? "bg-white text-black shadow-xs" : "text-neutral-500 hover:text-black"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Tickets</span>
              </button>
            </div>
          </div>
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
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search orders, clients, or items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#FAF9F6] border border-[#E6E3DB] text-xs focus:outline-none focus:border-black rounded-xs"
            />
          </div>
        </div>

        {/* Kanban Board */}
        {viewMode === "kanban" ? (
          <div className="overflow-x-auto pb-4">
            <Kanban
              value={board}
              onValueChange={applyBoard}
              getItemValue={(item) => item.id}
              onValueCommit={handleValueCommit}
              restoreOnCancel
              onDragStart={() => {
                draggingRef.current = true;
              }}
              onDragEnd={() => {
                setTimeout(() => {
                  draggingRef.current = false;
                }, 0);
              }}
              onDragCancel={() => {
                draggingRef.current = false;
              }}
            >
              <KanbanBoard className="flex items-start gap-3">
                {PIPELINE_COLUMNS.map((column) => {
                  const columnOrders = board[column.key] ?? [];
                  return (
                    <KanbanColumn
                      key={column.key}
                      value={column.key}
                      className="w-[240px] shrink-0 bg-[#FAF9F6] border border-[#E6E3DB] rounded-xs"
                    >
                      <div className="px-3 py-2.5 border-b border-[#E6E3DB] flex items-center justify-between bg-white rounded-t-xs">
                        <span className="text-xs font-medium text-black flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${column.dot}`} />
                          {column.label}
                        </span>
                        <span className="text-[11px] font-mono px-1.5 py-0.5 bg-[#F4F2ED] text-neutral-600 rounded-xs">
                          {columnOrders.length}
                        </span>
                      </div>

                      <KanbanColumnContent
                        value={column.key}
                        className="p-2 gap-2 overflow-y-auto max-h-[600px]"
                      >
                        {columnOrders.length === 0 ? (
                          <div className="h-24 flex items-center justify-center text-xs text-neutral-400 italic border border-dashed border-[#E6E3DB] rounded-xs bg-white">
                            Drop here
                          </div>
                        ) : (
                          columnOrders.map((order) => (
                            <KanbanItem key={order.id} value={order.id}>
                              <KanbanItemHandle>
                                <div
                                  onClick={() => {
                                    if (!draggingRef.current) setSelectedTicket(order);
                                  }}
                                  className="p-3 bg-white border border-[#E6E3DB] hover:border-black/40 transition-colors space-y-2 rounded-xs select-none cursor-grab active:cursor-grabbing"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-mono text-xs font-medium text-black">
                                      {order.order_number}
                                    </span>
                                    <Badge variant="secondary" className="text-[10px] capitalize shrink-0">
                                      {order.priority}
                                    </Badge>
                                  </div>

                                  <div className="text-xs font-medium text-black truncate flex items-center gap-1">
                                    <span className="truncate">
                                      {order.customers?.customer_name ?? "No customer"}
                                    </span>
                                    <ExternalLink className="w-3 h-3 text-neutral-400 shrink-0" />
                                  </div>

                                  <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                                    {order.item_summary}
                                  </p>

                                  <div className="pt-2 border-t border-[#F0ECE1] flex items-center justify-between text-xs font-mono">
                                    <span className="text-neutral-500">{order.delivery_date ?? "—"}</span>
                                    {showRevenue && (
                                      <span className="text-black font-medium">
                                        {formatCurrency(Number(order.total))}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </KanbanItemHandle>
                            </KanbanItem>
                          ))
                        )}
                      </KanbanColumnContent>
                    </KanbanColumn>
                  );
                })}
              </KanbanBoard>
              <KanbanOverlay>
                {({ value }) => {
                  const ghost = orders.find((o) => o.id === String(value));
                  if (!ghost) return null;
                  return (
                    <div className="p-3 bg-white border border-black shadow-lg rounded-xs opacity-95 w-[240px] space-y-2 rotate-1">
                      <span className="font-mono text-xs font-medium text-black">
                        {ghost.order_number}
                      </span>
                      <div className="text-xs text-black truncate">
                        {ghost.customers?.customer_name}
                      </div>
                    </div>
                  );
                }}
              </KanbanOverlay>
            </Kanban>
          </div>
        ) : (
          /* Ticket List */
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedTicket(order)}
                className="p-4 bg-white border border-[#E6E3DB] hover:border-black cursor-pointer transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-medium text-black">{order.order_number}</span>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {order.status}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] capitalize">{order.priority}</Badge>
                  </div>
                  <h4 className="text-sm font-medium text-black flex items-center gap-1">
                    {order.customers ? (
                      <Link
                        href={`/customers/${order.customers.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline"
                      >
                        {order.customers.customer_name}
                      </Link>
                    ) : (
                      <span className="text-neutral-400">No customer</span>
                    )}
                    <ExternalLink className="w-3 h-3 text-neutral-400" />
                    <span className="text-neutral-400">—</span>
                    <span className="text-neutral-600 truncate">{order.item_summary}</span>
                  </h4>
                  {order.notes && (
                    <p className="text-xs text-neutral-500 italic max-w-2xl">"{order.notes}"</p>
                  )}
                </div>

                <div className="flex items-center gap-4 self-end md:self-auto shrink-0">
                  <div className="text-right font-mono text-xs">
                    {showRevenue && (
                      <div className="font-semibold text-black">{formatCurrency(Number(order.total))}</div>
                    )}
                    <div className="text-[11px] text-neutral-500">Due: {order.delivery_date ?? "—"}</div>
                  </div>
                  {canWrite && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Edit order"
                      onClick={(e) => { e.stopPropagation(); setEditing(order); setFormOpen(true); }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {canWrite && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={(e) => advanceOrderStatus(order.id, e)}
                    >
                      Advance
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {filteredOrders.length === 0 && !loadError && (
              <div className="text-center py-12 text-xs text-neutral-400">
                No orders found.
              </div>
            )}
          </div>
        )}

        {/* Order Detail Modal */}
        {selectedTicket && (
          <Dialog
            open={Boolean(selectedTicket)}
            onOpenChange={(open) => !open && setSelectedTicket(null)}
          >
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-neutral-500">{selectedTicket.order_number}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {selectedTicket.status}
                  </Badge>
                </div>
                <DialogTitle className="text-lg">
                  {selectedTicket.customers?.customer_name ?? "No customer"}
                </DialogTitle>
                <DialogDescription>{selectedTicket.customers?.email}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                <div className="p-3 bg-[#FAF9F6] border border-[#E6E3DB] space-y-1">
                  <span className="text-[11px] text-neutral-500">Item Description</span>
                  <div className="font-medium text-black text-sm">{selectedTicket.item_summary}</div>
                  {showRevenue && (
                    <div className="font-mono text-neutral-700 pt-1">
                      Total: {formatCurrency(Number(selectedTicket.total))}
                    </div>
                  )}
                </div>

                {selectedTicket.notes && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-neutral-500">Tailor Notes</span>
                    <p className="text-neutral-700 bg-white p-3 border border-[#E6E3DB] leading-relaxed">
                      {selectedTicket.notes}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 border border-[#E6E3DB] bg-[#FAF9F6]">
                    <div className="text-neutral-500">Target Delivery</div>
                    <div className="font-medium text-black mt-0.5">{selectedTicket.delivery_date ?? "—"}</div>
                  </div>
                  <div className="p-2.5 border border-[#E6E3DB] bg-[#FAF9F6]">
                    <div className="text-neutral-500">Priority</div>
                    <div className="font-medium text-black mt-0.5 capitalize">{selectedTicket.priority}</div>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
                    <Link href={`/orders/${selectedTicket.id}`}>
                      View Full Details
                    </Link>
                  </Button>
                  {canWrite && (
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => { setEditing(selectedTicket); setSelectedTicket(null); setFormOpen(true); }}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" />
                      Edit Order
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <OrderFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          initial={editing}
          customers={customerOptions}
          onSave={handleSaveOrder}
        />
      </div>
    </RouteGuard>
  );
}

function prevContainersGet(
  meta: KanbanCommitMeta<OrderWithCustomer>,
  id: string
): string {
  for (const [col, items] of Object.entries(meta.previousValue)) {
    if (items.some((item) => item.id === id)) return col;
  }
  return "";
}
