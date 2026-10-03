"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { useAuth } from "@/lib/context/auth-context";
import { CustomerWithMeasurement } from "@/lib/supabase/database.types";
import {
  getCustomer,
  updateCustomer,
  CustomerInput,
} from "@/lib/supabase/queries-customers";
import {
  listOrdersByCustomer,
} from "@/lib/supabase/queries-orders";
import { listCustomerAttachments } from "@/lib/supabase/queries-chat";
import { ChatAttachmentRow } from "@/lib/supabase/database.types";
import { OrderWithCustomer } from "@/lib/supabase/database.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerDetailSkeleton } from "@/components/ui/page-skeletons";
import { ArrowLeft, Ruler, Mail, Phone, ShoppingBag, ExternalLink, Pencil, Image as ImageIcon, FileText } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CustomerFormDialog } from "@/components/forms/CustomerFormDialog";
import { useActor } from "@/lib/context/actor-context";
import { logActivity } from "@/lib/supabase/activity";

const MEASUREMENT_FIELDS: { key: string; label: string }[] = [
  { key: "blouse_length", label: "Blouse Length" },
  { key: "shoulder", label: "Shoulder" },
  { key: "chest", label: "Chest" },
  { key: "waist", label: "Waist" },
  { key: "armhole", label: "Armhole" },
  { key: "sleeve_length", label: "Sleeve Length" },
  { key: "sleeve_round", label: "Sleeve Round" },
  { key: "front_neck_deep", label: "Front Neck" },
  { key: "back_neck_deep", label: "Back Neck" },
];

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const { permissions } = useAuth();
  const { actor } = useActor();
  const [customer, setCustomer] = useState<CustomerWithMeasurement | null>(null);
  const [orders, setOrders] = useState<OrderWithCustomer[]>([]);
  const [attachments, setAttachments] = useState<(ChatAttachmentRow & { order_number?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const canWrite = permissions.includes("customers.write");
  const showRevenue = permissions.includes("revenue.read");

  useEffect(() => {
    (async () => {
      try {
        const row = await getCustomer(params.id);
        if (!row) {
          setNotFound(true);
          return;
        }
        setCustomer(row);
        setOrders(await listOrdersByCustomer(params.id));
        try {
          setAttachments(await listCustomerAttachments(params.id));
        } catch {
          // Chat tables may not be migrated yet
        }
      } catch (e) {
        setLoadError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  const handleSave = async (values: CustomerInput) => {
    if (!customer) return;
    const updated = await updateCustomer(
      customer.id,
      {
        customer_name: values.customer_name,
        email: values.email,
        phone: values.phone,
        avatar_url: values.avatar_url,
        special_notes: values.special_notes,
        measurement_id: customer.measurement_id,
      },
      values.measurement
    );
    setCustomer(updated);
    await logActivity({
      actor,
      action: "edited",
      entityType: "customer",
      entityId: customer.id,
      entityLabel: values.customer_name,
      customerId: customer.id,
      customerName: values.customer_name,
      detail: "profile + measurements",
    });
  };

  if (loading) return <CustomerDetailSkeleton />;

  if (notFound || (!customer && !loadError)) {
    return (
      <RouteGuard requiredPermission="customers.read" moduleName="Customers">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <h2 className="text-lg font-medium text-black mb-2">Customer Not Found</h2>
          <p className="text-xs text-neutral-500 mb-4">
            The customer you are looking for does not exist.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/customers">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back to Customers
            </Link>
          </Button>
        </div>
      </RouteGuard>
    );
  }

  if (!customer) {
    return (
      <RouteGuard requiredPermission="customers.read" moduleName="Customers">
        <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xs">
          {loadError ?? "Failed to load customer."}
        </div>
      </RouteGuard>
    );
  }

  const m = customer.measurements;

  return (
    <RouteGuard requiredPermission="customers.read" moduleName="Customers">
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/customers"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Customers
          </Link>
          {canWrite && (
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setFormOpen(true)}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit Customer
            </Button>
          )}
        </div>

        {/* Customer Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden relative shrink-0 border border-[#E6E3DB] bg-[#F4F2ED] flex items-center justify-center">
                {customer.avatar_url ? (
                  <Image
                    src={customer.avatar_url}
                    alt={customer.customer_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="text-xl font-medium text-neutral-500">
                    {customer.customer_name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-semibold text-black tracking-tight">
                    {customer.customer_name}
                  </h1>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-neutral-500">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3" />
                    {customer.email}
                  </span>
                  {customer.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3" />
                      {customer.phone}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6 text-center sm:text-right">
                <div>
                  <div className="text-lg font-semibold text-black font-mono">
                    {customer.orders_count}
                  </div>
                  <div className="text-[10px] text-neutral-400 uppercase tracking-wide">
                    Orders
                  </div>
                </div>
                {showRevenue && (
                  <div>
                    <div className="text-lg font-semibold text-black font-mono">
                      {formatCurrency(Number(customer.total_spent))}
                    </div>
                    <div className="text-[10px] text-neutral-400 uppercase tracking-wide">
                      Total Spend
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Measurements */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-black flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                Blouse Measurements
                {m?.label && (
                  <span className="text-[10px] font-mono font-normal text-neutral-400 ml-auto">
                    {m.label}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {m ? (
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  {MEASUREMENT_FIELDS.map((f) => (
                    <div key={f.key} className="p-2.5 bg-white border border-[#E6E3DB] rounded-xs">
                      <div className="text-[10px] text-neutral-400 font-sans">{f.label}</div>
                      <div className="text-sm font-semibold text-black mt-0.5">
                        {Number((m as unknown as Record<string, number>)[f.key])}"
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-neutral-400">
                  No measurements recorded yet.
                  {canWrite && " Use Edit to add them."}
                </div>
              )}

              {customer.special_notes && (
                <div className="p-3 bg-[#FAF9F6] border border-[#E6E3DB] text-neutral-600 leading-relaxed text-xs rounded-xs">
                  {customer.special_notes}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-black flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Order History
                <span className="text-[10px] font-mono font-normal text-neutral-400 ml-auto">
                  {orders.length} orders
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="block p-3 bg-white border border-[#E6E3DB] hover:border-black/40 transition-colors rounded-xs group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-medium text-black inline-flex items-center gap-1">
                          {order.order_number}
                          <ExternalLink className="w-3 h-3 text-neutral-400" />
                        </span>
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          {order.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="text-xs text-neutral-600 truncate">
                        {order.item_summary}
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[11px] font-mono text-neutral-400">
                        <span>{formatDate(order.created_at)}</span>
                        {showRevenue && (
                          <span className="text-black font-medium">
                            {formatCurrency(Number(order.total))}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-neutral-400">
                  No orders found for this customer.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Photos & Files (from chat) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-black flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Photos & Files
              <span className="text-[10px] font-mono font-normal text-neutral-400 ml-auto">
                {attachments.length} shared in chat
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attachments.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {attachments
                    .filter((a) => a.kind === "photo")
                    .map((att) => (
                      <div
                        key={att.id}
                        className="relative aspect-square bg-[#FAF9F6] border border-[#E6E3DB] rounded-xs overflow-hidden group"
                        title={att.name}
                      >
                        {att.url && !att.url.startsWith("#") ? (
                          <Image src={att.url} alt={att.name || "Photo"} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-300">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    ))}
                </div>
                {attachments.filter((a) => a.kind !== "photo").map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-3 p-2.5 bg-white border border-[#E6E3DB] rounded-xs"
                  >
                    <FileText className="w-4 h-4 text-neutral-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-black truncate">{att.name || "File"}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        {att.size_text}
                        {att.order_number && ` · order ${att.order_number}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-neutral-400">
                No photos or files shared yet — they appear here when added in chat.
              </div>
            )}
          </CardContent>
        </Card>

        {canWrite && (
          <CustomerFormDialog open={formOpen} onOpenChange={setFormOpen} initial={customer} onSave={handleSave} />
        )}
      </div>
    </RouteGuard>
  );
}
