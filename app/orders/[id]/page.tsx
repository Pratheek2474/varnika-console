"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { useAuth } from "@/lib/context/auth-context";
import {
  addOrderDocument,
  addOrderPhoto,
  getOrderDetail,
  isOrderPaid,
  orderManualPaid,
  setOrderPaid,
  updateOrder,
  OrderDetail as OrderDetailData,
} from "@/lib/supabase/queries-orders";
import { OrderInput } from "@/lib/supabase/queries-orders";
import {
  createShipment,
  createTransaction,
  listShipments,
  listTransactions,
  ShipmentInput,
  TransactionInput,
} from "@/lib/supabase/queries-ops";
import { DocumentKind } from "@/lib/supabase/database.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timeline } from "@/components/ui/timeline";
import { OrderDetailSkeleton } from "@/components/ui/page-skeletons";
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Download,
  Calendar,
  Package,
  ExternalLink,
  Pencil,
  CreditCard,
  Truck,
  Plus,
} from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { OrderFormDialog } from "@/components/forms/OrderFormDialog";
import { TransactionFormDialog } from "@/components/forms/TransactionFormDialog";
import { ShipmentFormDialog } from "@/components/forms/ShipmentFormDialog";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useActor } from "@/lib/context/actor-context";
import { logActivity } from "@/lib/supabase/activity";

const DOCUMENT_ICONS: Record<DocumentKind, string> = {
  invoice: "📄",
  measurement_chart: "📏",
  design_sketch: "✏️",
  receipt: "🧾",
  shipping_label: "📦",
  other: "📎",
};

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { permissions } = useAuth();
  const { actor } = useActor();
  const [detail, setDetail] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ url: string; label: string } | null>(null);
  const [transactions, setTransactions] = useState<
    { id: string; amount: number; currency: string; payment_mode: string; payment_ref: string; occurred_at: string }[]
  >([]);
  const [shipments, setShipments] = useState<
    {
      id: string;
      tracking_number: string;
      carrier: string;
      destination_city: string;
      address: string;
      recipient_name: string;
      status: string;
      estimated_delivery: string;
      shipment_milestones: { id: string; status_text: string; location: string; time_text: string }[];
    }[]
  >([]);
  const [txnOpen, setTxnOpen] = useState(false);
  const [shipOpen, setShipOpen] = useState(false);

  const canWrite = permissions.includes("orders.write");
  const canTransact = permissions.includes("transactions.write");
  const canShip = permissions.includes("delivery.write");
  const showRevenue = permissions.includes("revenue.read");

  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const row = await getOrderDetail(params.id);
        if (!row) {
          setNotFound(true);
          return;
        }
        setDetail(row);
        try {
          const txns = await listTransactions();
          setTransactions(
            txns
              .filter((t) => t.order_id === params.id)
              .map((t) => ({
                id: t.id,
                amount: Number(t.amount),
                currency: t.currency,
                payment_mode: t.payment_mode,
                payment_ref: t.payment_ref,
                occurred_at: t.occurred_at,
              }))
          );
        } catch {
          // Transactions table may not be available
        }
        try {
          const ships = await listShipments();
          setShipments(
            ships
              .filter((s) => s.order_id === params.id)
              .map((s) => ({
                id: s.id,
                tracking_number: s.tracking_number,
                carrier: s.carrier,
                destination_city: s.destination_city,
                address: (s as { address?: string }).address ?? "",
                recipient_name: s.recipient_name,
                status: s.status,
                estimated_delivery: s.estimated_delivery,
                shipment_milestones: s.shipment_milestones.map((m) => ({
                  id: m.id,
                  status_text: m.status_text,
                  location: m.location,
                  time_text: m.time_text,
                })),
              }))
          );
        } catch {
          // Shipments table may not be available
        }
      } catch (e) {
        console.error(e);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  const handleSave = async (values: OrderInput) => {
    if (!detail) return;
    const updated = await updateOrder(detail.order.id, values);
    setDetail({ ...detail, order: { ...detail.order, ...updated } });
    await logActivity({
      actor,
      action: "edited",
      entityType: "order",
      entityId: detail.order.id,
      entityLabel: updated.order_number,
      customerId: updated.customers?.id ?? updated.customer_id,
      customerName: updated.customers?.customer_name ?? "",
      orderId: detail.order.id,
      orderNumber: updated.order_number,
    });
  };

  const refreshFinance = async () => {
    if (!detail) return;
    try {
      const txns = await listTransactions();
      setTransactions(
        txns
          .filter((t) => t.order_id === detail.order.id)
          .map((t) => ({
            id: t.id,
            amount: Number(t.amount),
            currency: t.currency,
            payment_mode: t.payment_mode,
            payment_ref: t.payment_ref,
            occurred_at: t.occurred_at,
          }))
      );
    } catch (e) {
      console.error(e);
    }
    try {
      const ships = await listShipments();
      setShipments(
        ships
          .filter((s) => s.order_id === detail.order.id)
          .map((s) => ({
            id: s.id,
            tracking_number: s.tracking_number,
            carrier: s.carrier,
            destination_city: s.destination_city,
            address: (s as { address?: string }).address ?? "",
            recipient_name: s.recipient_name,
            status: s.status,
            estimated_delivery: s.estimated_delivery,
            shipment_milestones: s.shipment_milestones.map((m) => ({
              id: m.id,
              status_text: m.status_text,
              location: m.location,
              time_text: m.time_text,
            })),
          }))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveTransaction = async (values: TransactionInput) => {
    if (!detail) return;
    await createTransaction(values);
    await logActivity({
      actor,
      action: "added",
      entityType: "transaction",
      entityId: detail.order.id,
      entityLabel: values.payment_ref,
      detail: `${values.amount} USD`,
      customerId: values.customer_id,
      customerName: detail.order.customers?.customer_name ?? "",
      orderId: detail.order.id,
      orderNumber: detail.order.order_number,
    });
    await refreshFinance();
  };

  const handleSaveShipment = async (
    values: ShipmentInput,
    milestone?: { status_text: string; location: string }
  ) => {
    if (!detail) return;
    await createShipment(values, milestone);
    await logActivity({
      actor,
      action: "added",
      entityType: "shipment",
      entityId: detail.order.id,
      entityLabel: values.tracking_number,
      orderId: detail.order.id,
      orderNumber: detail.order.order_number,
    });
    await refreshFinance();
  };

  if (loading) return <OrderDetailSkeleton />;

  if (notFound || !detail) {
    return (
      <RouteGuard requiredPermission="orders.read" moduleName="Orders">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <h2 className="text-lg font-medium text-black mb-2">Order Not Found</h2>
          <p className="text-xs text-neutral-500 mb-4">
            The order you are looking for does not exist.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/orders">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back to Orders
            </Link>
          </Button>
        </div>
      </RouteGuard>
    );
  }

  const { order, timeline, photos, documents } = detail;

  const paidSum = transactions.reduce((s, t) => s + Number(t.amount), 0);
  const manualPaid = orderManualPaid(order);
  const paid = isOrderPaid(order, paidSum);

  const togglePaid = async () => {
    try {
      await setOrderPaid(order.id, !manualPaid);
      setDetail({ ...detail, order: { ...order, is_paid: !manualPaid } });
      await logActivity({
        actor,
        action: "edited",
        entityType: "order",
        entityId: order.id,
        entityLabel: order.order_number,
        detail: !manualPaid ? "marked as paid" : "marked as unpaid",
        customerId: order.customers?.id ?? order.customer_id,
        customerName: order.customers?.customer_name ?? "",
        orderId: order.id,
        orderNumber: order.order_number,
      });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const refreshMedia = async () => {
    try {
      const row = await getOrderDetail(order.id);
      if (row) setDetail({ ...row, order: detail.order });
    } catch (e) {
      console.error(e);
    }
  };

  const handlePhotoFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingPhoto(true);
    try {
      for (const file of Array.from(files)) {
        const photo = await addOrderPhoto(order.id, file);
        await logActivity({
          actor,
          action: "added",
          entityType: "order",
          entityId: order.id,
          entityLabel: order.order_number,
          detail: `added photo ${photo.caption || file.name}`,
          customerId: order.customers?.id ?? order.customer_id,
          customerName: order.customers?.customer_name ?? "",
          orderId: order.id,
          orderNumber: order.order_number,
        });
      }
      await refreshMedia();
      toast.success(files.length === 1 ? "Photo added." : `${files.length} photos added.`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDocFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingDoc(true);
    try {
      for (const file of Array.from(files)) {
        const doc = await addOrderDocument(order.id, file);
        await logActivity({
          actor,
          action: "added",
          entityType: "order",
          entityId: order.id,
          entityLabel: order.order_number,
          detail: `added file ${doc.name}`,
          customerId: order.customers?.id ?? order.customer_id,
          customerName: order.customers?.customer_name ?? "",
          orderId: order.id,
          orderNumber: order.order_number,
        });
      }
      await refreshMedia();
      toast.success(files.length === 1 ? "File added." : `${files.length} files added.`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploadingDoc(false);
    }
  };

  // Hold Check only appears when the order is actually on hold
  // (or its timeline step is already reached) — never by default.
  const visibleTimeline = timeline.filter(
    (t) =>
      t.title !== "Hold Check" ||
      order.status === "hold" ||
      t.state !== "upcoming"
  );

  return (
    <RouteGuard requiredPermission="orders.read" moduleName="Orders">
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Orders
          </Link>
          {canWrite && (
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setFormOpen(true)}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit Order
            </Button>
          )}
        </div>

        {/* Order Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-semibold text-black tracking-tight font-mono">
                    {order.order_number}
                  </h1>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {order.status}
                  </Badge>
                  {paid ? (
                    <Badge className="text-[10px] border-green-300 bg-green-50 text-green-700">
                      Paid
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      Unpaid
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {order.priority}
                  </Badge>
                </div>
                <p className="text-sm text-neutral-600">{order.item_summary}</p>
              </div>
              {showRevenue && (
                <div className="text-right">
                  <div className="text-2xl font-semibold text-black font-mono">
                    {formatCurrency(Number(order.total))}
                  </div>
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wide">
                    Order Total
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column — Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-black flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Order Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {visibleTimeline.length > 0 ? (
                  <Timeline
                    items={visibleTimeline.map((t) => ({
                      title: t.title,
                      description: t.description ?? undefined,
                      timestamp: t.display_time ?? undefined,
                      state: t.state,
                    }))}
                  />
                ) : (
                  <div className="text-center py-8 text-xs text-neutral-400">
                    No timeline events available.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Photos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-black flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Photos
                  <span className="text-[10px] font-mono font-normal text-neutral-400 ml-auto">
                    {photos.length} images
                  </span>
                  {canWrite && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px]"
                      disabled={uploadingPhoto}
                      onClick={() => photoInputRef.current?.click()}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {uploadingPhoto ? "Uploading…" : "Add"}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handlePhotoFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                {photos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photos.map((photo) => (
                      <button
                        key={photo.id}
                        onClick={() => setLightbox({ url: photo.url, label: photo.caption })}
                        className="group relative aspect-square bg-[#FAF9F6] border border-[#E6E3DB] rounded-xs overflow-hidden cursor-pointer hover:border-black/40 transition-colors"
                        title="Open photo"
                      >
                        <Image
                          src={photo.url}
                          alt={photo.caption}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[10px] text-white truncate">{photo.caption}</p>
                          <p className="text-[9px] text-white/70 font-mono">
                            {formatDate(photo.uploaded_at)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-neutral-400">
                    No photos uploaded yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column — Details & Documents */}
          <div className="space-y-6">
            {/* Order Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-black flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-[#FAF9F6] border border-[#E6E3DB] rounded-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-neutral-500">Customer</span>
                    {order.customers ? (
                      <Link
                        href={`/customers/${order.customers.id}`}
                        className="text-xs font-medium text-black hover:underline inline-flex items-center gap-1"
                      >
                        {order.customers.customer_name}
                        <ExternalLink className="w-3 h-3 text-neutral-400" />
                      </Link>
                    ) : (
                      <span className="text-xs text-neutral-400">No customer</span>
                    )}
                  </div>
                  {order.customers && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-neutral-500">Email</span>
                      <span className="text-[11px] text-neutral-700 truncate max-w-[140px]">
                        {order.customers.email}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 border border-[#E6E3DB] bg-[#FAF9F6] rounded-xs">
                    <div className="text-neutral-500">Created</div>
                    <div className="font-medium text-black mt-0.5">
                      {formatDate(order.created_at)}
                    </div>
                  </div>
                  <div className="p-2.5 border border-[#E6E3DB] bg-[#FAF9F6] rounded-xs">
                    <div className="text-neutral-500">Delivery</div>
                    <div className="font-medium text-black mt-0.5">
                      {order.delivery_date ?? "—"}
                    </div>
                  </div>
                </div>

                {order.notes && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-neutral-500">Tailor Notes</span>
                    <p className="text-neutral-700 bg-white p-3 border border-[#E6E3DB] leading-relaxed text-xs rounded-xs">
                      {order.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-black flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payment
                  <span className="text-[10px] font-mono font-normal text-neutral-400 ml-auto">
                    {transactions.length > 0 ? `${transactions.length} record${transactions.length === 1 ? "" : "s"}` : "not paid"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between p-2.5 border border-[#E6E3DB] bg-white rounded-xs text-xs">
                  <span className="text-neutral-500">Status</span>
                  {paid ? (
                    <Badge className="text-[10px] border-green-300 bg-green-50 text-green-700">
                      Paid{manualPaid ? " · manual" : paidSum > 0 ? " · via transactions" : ""}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">Unpaid</Badge>
                  )}
                </div>
                {transactions.length > 0 ? (
                  <>
                    {transactions.map((t) => (
                      <div key={t.id} className="p-3 bg-[#FAF9F6] border border-[#E6E3DB] rounded-xs space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500">Amount</span>
                          <span className="font-mono font-semibold text-black">
                            {showRevenue ? formatCurrency(t.amount, t.currency) : "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500">Mode</span>
                          <Badge variant="secondary" className="text-[10px] capitalize">
                            {t.payment_mode.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-neutral-500">Ref</span>
                          <span className="font-mono text-[11px] text-neutral-700 truncate">{t.payment_ref}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500">Date</span>
                          <span className="font-mono text-[11px] text-neutral-700">{formatDateTime(t.occurred_at)}</span>
                        </div>
                      </div>
                    ))}
                    {canTransact && (
                      <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setTxnOpen(true)}>
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Add Transaction
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-[#FAF9F6] border border-[#E6E3DB] rounded-xs text-xs text-neutral-500 text-center">
                      Not paid yet.
                    </div>
                    {canTransact && (
                      <Button variant="default" size="sm" className="w-full text-xs" onClick={() => setTxnOpen(true)}>
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Add Transaction
                      </Button>
                    )}
                  </>
                )}
                {canWrite && (
                  <Button
                    variant={manualPaid ? "outline" : "default"}
                    size="sm"
                    className="w-full text-xs"
                    onClick={togglePaid}
                  >
                    {manualPaid ? "Untick — Mark as Unpaid" : "Tick as Paid"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Delivery */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-black flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Delivery
                  <span className="text-[10px] font-mono font-normal text-neutral-400 ml-auto">
                    {shipments.length > 0 ? `${shipments.length} shipment${shipments.length === 1 ? "" : "s"}` : "not shipped"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {shipments.length > 0 ? (
                  <>
                    {shipments.map((s) => (
                      <div key={s.id} className="p-3 bg-[#FAF9F6] border border-[#E6E3DB] rounded-xs space-y-1.5 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-semibold text-black truncate">{s.tracking_number}</span>
                          <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                            {s.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500">Carrier</span>
                          <span className="font-medium text-black">{s.carrier || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500">Recipient</span>
                          <span className="font-medium text-black truncate max-w-[140px]">{s.recipient_name || order.customers?.customer_name || "—"}</span>
                        </div>
                        {(s.address || s.destination_city) && (
                          <div className="space-y-0.5">
                            <span className="text-neutral-500">Address</span>
                            <p className="text-neutral-800 leading-relaxed">
                              {s.address || s.destination_city}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500">Est. delivery</span>
                          <span className="font-mono text-[11px] text-black">{s.estimated_delivery || "—"}</span>
                        </div>
                        {s.shipment_milestones.length > 0 && (
                          <div className="pt-1.5 border-t border-[#F0ECE1] space-y-1.5">
                            {s.shipment_milestones.map((m) => (
                              <div key={m.id} className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-black mt-1 shrink-0" />
                                <div>
                                  <div className="font-medium text-black">{m.status_text}</div>
                                  <div className="text-neutral-400 font-mono text-[11px]">
                                    {m.location} · {m.time_text}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                          <Link href="/delivery">Open in Delivery</Link>
                        </Button>
                      </div>
                    ))}
                    {canShip && (
                      <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setShipOpen(true)}>
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Add Delivery
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-[#FAF9F6] border border-[#E6E3DB] rounded-xs text-xs text-neutral-500 text-center">
                      Not shipped yet.
                    </div>
                    {canShip && (
                      <Button variant="default" size="sm" className="w-full text-xs" onClick={() => setShipOpen(true)}>
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Add Delivery
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-black flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documents
                  <span className="text-[10px] font-mono font-normal text-neutral-400 ml-auto">
                    {documents.length} files
                  </span>
                  {canWrite && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px]"
                      disabled={uploadingDoc}
                      onClick={() => docInputRef.current?.click()}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {uploadingDoc ? "Uploading…" : "Add"}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  ref={docInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,image/*"
                  className="hidden"
                  onChange={(e) => {
                    handleDocFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                {documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 p-2.5 bg-white border border-[#E6E3DB] hover:border-black/40 transition-colors rounded-xs group"
                      >
                        <span className="text-lg">{DOCUMENT_ICONS[doc.kind]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-black truncate underline underline-offset-2">
                            {doc.name}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono">
                            {doc.size_text} · {formatDate(doc.uploaded_at)}
                          </div>
                        </div>
                        <Download className="w-3.5 h-3.5 text-neutral-400 group-hover:text-black transition-colors shrink-0" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-neutral-400">
                    No documents uploaded yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {canWrite && (
          <OrderFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            initial={order}
            customers={
              order.customers
                ? [{ id: order.customers.id, customer_name: order.customers.customer_name }]
                : []
            }
            onSave={handleSave}
          />
        )}

        {/* Photo lightbox */}
        <Dialog open={Boolean(lightbox)} onOpenChange={(open) => !open && setLightbox(null)}>
          <DialogContent className="max-w-3xl p-2 bg-black border-black">
            <DialogTitle className="sr-only">{lightbox?.label ?? "Photo"}</DialogTitle>
            {lightbox && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={lightbox.url} alt={lightbox.label} className="w-full max-h-[80vh] object-contain" />
            )}
          </DialogContent>
        </Dialog>

        {canTransact && order.customer_id && (
          <TransactionFormDialog
            open={txnOpen}
            onOpenChange={setTxnOpen}
            initial={null}
            customers={
              order.customers
                ? [{ id: order.customers.id, customer_name: order.customers.customer_name }]
                : []
            }
            orders={[
              {
                id: order.id,
                order_number: order.order_number,
                customer_id: order.customer_id,
                total: Number(order.total),
              },
            ]}
            onSave={handleSaveTransaction}
          />
        )}

        {canShip && (
          <ShipmentFormDialog
            open={shipOpen}
            onOpenChange={setShipOpen}
            initial={null}
            orders={[
              {
                id: order.id,
                order_number: order.order_number,
                customer_name: order.customers?.customer_name ?? "No customer",
              },
            ]}
            onSave={handleSaveShipment}
          />
        )}
      </div>
    </RouteGuard>
  );
}
