"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { useAuth } from "@/lib/context/auth-context";
import {
  getOrderDetail,
  updateOrder,
  OrderDetail as OrderDetailData,
} from "@/lib/supabase/queries-orders";
import { OrderInput } from "@/lib/supabase/queries-orders";
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
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderFormDialog } from "@/components/forms/OrderFormDialog";
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

  const canWrite = permissions.includes("orders.write");
  const showRevenue = permissions.includes("revenue.read");

  useEffect(() => {
    (async () => {
      try {
        const row = await getOrderDetail(params.id);
        if (!row) {
          setNotFound(true);
          return;
        }
        setDetail(row);
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
                {timeline.length > 0 ? (
                  <Timeline
                    items={timeline.map((t) => ({
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
                </CardTitle>
              </CardHeader>
              <CardContent>
                {photos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="group relative aspect-square bg-[#FAF9F6] border border-[#E6E3DB] rounded-xs overflow-hidden"
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
                      </div>
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

            {/* Documents */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-black flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documents
                  <span className="text-[10px] font-mono font-normal text-neutral-400 ml-auto">
                    {documents.length} files
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 p-2.5 bg-white border border-[#E6E3DB] hover:border-black/40 transition-colors rounded-xs group"
                      >
                        <span className="text-lg">{DOCUMENT_ICONS[doc.kind]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-black truncate">
                            {doc.name}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono">
                            {doc.size_text} · {formatDate(doc.uploaded_at)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </div>
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
      </div>
    </RouteGuard>
  );
}
