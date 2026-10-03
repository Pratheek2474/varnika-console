"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { useAuth } from "@/lib/context/auth-context";
import { ShipmentWithMilestones } from "@/lib/supabase/database.types";
import {
  createShipment,
  listShipments,
  updateShipment,
  ShipmentInput,
} from "@/lib/supabase/queries-ops";
import { listOrders } from "@/lib/supabase/queries-orders";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardsListSkeleton } from "@/components/ui/page-skeletons";
import { Plus, Pencil, ExternalLink } from "lucide-react";
import { ShipmentFormDialog } from "@/components/forms/ShipmentFormDialog";
import { useActor } from "@/lib/context/actor-context";
import { logActivity } from "@/lib/supabase/activity";

export default function DeliveryPage() {
  const { permissions } = useAuth();
  const { actor } = useActor();
  const [search, setSearch] = useState("");
  const [shipments, setShipments] = useState<ShipmentWithMilestones[]>([]);
  const [orderOptions, setOrderOptions] = useState<{ id: string; order_number: string; customer_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ShipmentWithMilestones | null>(null);

  const canWrite = permissions.includes("delivery.write");

  const refresh = async () => {
    try {
      setLoadError(null);
      const [rows, ords] = await Promise.all([listShipments(), listOrders()]);
      setShipments(rows);
      setOrderOptions(
        ords.map((o) => ({
          id: o.id,
          order_number: o.order_number,
          customer_name: o.customers?.customer_name ?? "No customer",
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

  const filtered = shipments.filter((s) =>
    s.tracking_number.toLowerCase().includes(search.toLowerCase()) ||
    s.recipient_name.toLowerCase().includes(search.toLowerCase()) ||
    s.destination_city.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (
    values: ShipmentInput,
    milestone?: { status_text: string; location: string }
  ) => {
    const orderNumber =
      orderOptions.find((o) => o.id === values.order_id)?.order_number ?? "";
    if (editing) {
      await updateShipment(editing.id, values, milestone);
      await logActivity({
        actor,
        action: "edited",
        entityType: "shipment",
        entityId: editing.id,
        entityLabel: values.tracking_number,
        detail: milestone?.status_text.trim()
          ? `milestone: ${milestone.status_text.trim()}`
          : `status ${values.status.replace(/_/g, " ")}`,
        orderId: values.order_id,
        orderNumber,
      });
      setEditing(null);
    } else {
      await createShipment(values, milestone);
      const created = (await listShipments()).find(
        (s) => s.tracking_number === values.tracking_number
      );
      await logActivity({
        actor,
        action: "added",
        entityType: "shipment",
        entityId: created?.id,
        entityLabel: values.tracking_number,
        orderId: values.order_id,
        orderNumber,
      });
    }
    await refresh();
  };

  if (loading) return <CardsListSkeleton cards={4} />;

  return (
    <RouteGuard
      requiredPermission="delivery.read"
      requiredFeature="delivery_tracking"
      moduleName="Delivery"
    >
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#E6E3DB]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">
              Delivery & Tracking
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Active courier dispatches, tracking airway bills, and delivery status.
            </p>
          </div>
          {canWrite && (
            <Button variant="default" size="sm" className="h-8 text-xs shrink-0" onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Delivery
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
            <input
              type="text"
              placeholder="Search tracking, recipient, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-3 py-1.5 bg-[#FAF9F6] border border-[#E6E3DB] text-xs focus:outline-none focus:border-black rounded-xs"
            />
          </div>
        </div>

        {/* Shipment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((shipment) => {
            const order = shipment.orders;
            const customer = (order as unknown as { customers?: { id: string; customer_name: string } | null })?.customers ?? null;
            return (
              <Card key={shipment.id} className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-semibold text-black">
                      {shipment.tracking_number}
                    </span>
                    <div className="text-xs text-neutral-400 mt-0.5">
                      Carrier: {shipment.carrier || "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {shipment.status.replace(/_/g, " ")}
                    </Badge>
                    {canWrite && (
                      <button
                        onClick={() => { setEditing(shipment); setFormOpen(true); }}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-xs border border-[#E6E3DB] hover:border-black hover:bg-[#F4F2ED] transition-colors"
                        title="Edit delivery"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-[#FAF9F6] border border-[#E6E3DB] space-y-1.5 text-xs rounded-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Customer:</span>
                    {customer ? (
                      <Link href={`/customers/${customer.id}`} className="font-medium text-black hover:underline inline-flex items-center gap-1">
                        {customer.customer_name}
                        <ExternalLink className="w-3 h-3 text-neutral-400" />
                      </Link>
                    ) : (
                      <span className="font-medium text-black">{shipment.recipient_name}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Order:</span>
                    {order ? (
                      <Link href={`/orders/${order.id}`} className="font-mono text-black hover:underline inline-flex items-center gap-1">
                        {order.order_number}
                        <ExternalLink className="w-3 h-3 text-neutral-400" />
                      </Link>
                    ) : (
                      <span className="font-mono text-neutral-500">—</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Destination:</span>
                    <span className="text-neutral-800">{shipment.destination_city}</span>
                  </div>
                  {((shipment as { address?: string }).address ?? "") && (
                    <div className="space-y-0.5">
                      <span className="text-neutral-500">Address:</span>
                      <p className="text-neutral-800 leading-relaxed">
                        {(shipment as { address?: string }).address}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-[#F0ECE1]">
                    <span className="text-neutral-500">Estimated Delivery:</span>
                    <span className="font-mono font-medium text-black">{shipment.estimated_delivery || "—"}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1 text-xs">
                  <span className="text-[10px] uppercase font-mono text-neutral-400">
                    Tracking Milestones
                  </span>
                  <div className="space-y-2">
                    {shipment.shipment_milestones.map((mm) => (
                      <div key={mm.id} className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-black mt-1.5 shrink-0" />
                        <div>
                          <div className="font-medium text-black text-xs">{mm.status_text}</div>
                          <div className="text-neutral-400 font-mono text-[11px]">
                            {mm.location} · {mm.time_text}
                          </div>
                        </div>
                      </div>
                    ))}
                    {shipment.shipment_milestones.length === 0 && (
                      <div className="text-neutral-400 italic">No milestones yet.</div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        {filtered.length === 0 && !loadError && (
          <div className="text-center py-12 text-xs text-neutral-400">
            No shipments found.
          </div>
        )}

        <ShipmentFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          initial={editing}
          orders={orderOptions}
          onSave={handleSave}
        />
      </div>
    </RouteGuard>
  );
}
