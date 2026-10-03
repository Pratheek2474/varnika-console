import { supabase } from "./client";
import {
  OrderDocumentRow,
  OrderPhotoRow,
  OrderStatus,
  OrderWithCustomer,
  PriorityLevel,
  TimelineEventRow,
  TimelineState,
} from "./database.types";

function throwIf(error: unknown, action: string): void {
  if (error) throw new Error(`${action}: ${(error as Error).message}`);
}

const ORDER_WITH_CUSTOMER =
  "*, customers (id, customer_name, email)";

export interface OrderInput {
  customer_id: string;
  item_summary: string;
  total: number;
  status: OrderStatus;
  priority: PriorityLevel;
  delivery_date: string;
  notes: string;
}

export async function listOrders(): Promise<OrderWithCustomer[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_WITH_CUSTOMER)
    .order("created_at", { ascending: false });
  throwIf(error, "Failed to load orders");
  return (data ?? []) as OrderWithCustomer[];
}

export interface OrderDetail {
  order: OrderWithCustomer;
  timeline: TimelineEventRow[];
  photos: OrderPhotoRow[];
  documents: OrderDocumentRow[];
}

export async function listOrdersByCustomer(
  customerId: string
): Promise<OrderWithCustomer[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_WITH_CUSTOMER)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  throwIf(error, "Failed to load customer orders");
  return (data ?? []) as OrderWithCustomer[];
}

export async function getOrderDetail(id: string): Promise<OrderDetail | null> {
  const { data: order, error } = await supabase
    .from("orders")
    .select(ORDER_WITH_CUSTOMER)
    .eq("id", id)
    .single();
  if (error && (error as { code?: string }).code !== "PGRST116") {
    throw new Error(`Failed to load order: ${(error as Error).message}`);
  }
  if (!order) return null;

  const [{ data: timeline }, { data: photos }, { data: documents }] =
    await Promise.all([
      supabase
        .from("order_timeline_events")
        .select("*")
        .eq("order_id", id)
        .order("position"),
      supabase.from("order_photos").select("*").eq("order_id", id),
      supabase.from("order_documents").select("*").eq("order_id", id),
    ]);

  return {
    order: order as OrderWithCustomer,
    timeline: (timeline ?? []) as TimelineEventRow[],
    photos: (photos ?? []) as OrderPhotoRow[],
    documents: (documents ?? []) as OrderDocumentRow[],
  };
}

async function nextOrderNumber(): Promise<string> {
  const { data, error } = await supabase
    .from("orders")
    .select("order_number");
  throwIf(error, "Failed to generate order number");
  let max = 8849;
  for (const row of (data ?? []) as { order_number: string }[]) {
    const n = parseInt(row.order_number.replace(/\D/g, ""), 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return `VAR-${max + 1}`;
}

function defaultTimeline(orderId: string, deliveryDate: string) {
  const mk = (
    position: number,
    title: string,
    state: TimelineState,
    display_time: string | null,
    description?: string
  ) => ({
    order_id: orderId,
    position,
    title,
    state,
    display_time,
    description: description ?? null,
  });
  return [
    mk(0, "Order Placed", "completed", "Just now", "Order created in console."),
    mk(1, "Active", "current", "Scheduled"),
    mk(2, "Hold Check", "upcoming", "Scheduled"),
    mk(3, "Dispatched", "upcoming", "Scheduled"),
    mk(4, "Delivered", "upcoming", `Target: ${deliveryDate}`),
  ];
}

export async function createOrder(input: OrderInput): Promise<OrderWithCustomer> {
  const orderNumber = await nextOrderNumber();
  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_id: input.customer_id,
      item_summary: input.item_summary,
      total: input.total,
      currency: "USD",
      status: input.status,
      priority: input.priority,
      delivery_date: input.delivery_date || null,
      notes: input.notes,
    })
    .select(ORDER_WITH_CUSTOMER)
    .single();
  throwIf(error, "Failed to create order");

  const created = order as OrderWithCustomer;
  const { error: tlError } = await supabase
    .from("order_timeline_events")
    .insert(defaultTimeline(created.id, input.delivery_date));
  throwIf(tlError, "Failed to create order timeline");

  return created;
}

export async function updateOrder(
  id: string,
  input: OrderInput
): Promise<OrderWithCustomer> {
  const { data, error } = await supabase
    .from("orders")
    .update({
      customer_id: input.customer_id,
      item_summary: input.item_summary,
      total: input.total,
      status: input.status,
      priority: input.priority,
      delivery_date: input.delivery_date || null,
      notes: input.notes,
    })
    .eq("id", id)
    .select(ORDER_WITH_CUSTOMER)
    .single();
  throwIf(error, "Failed to update order");
  return data as OrderWithCustomer;
}

/** Manual paid tick (0009 `is_paid` column). Throws if the migration isn't applied. */
export async function setOrderPaid(id: string, paid: boolean): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({ is_paid: paid })
    .eq("id", id);
  if (error) {
    if (/is_paid/i.test(error.message)) {
      throw new Error(
        "Paid flag not in database yet — run migration 0009_order_paid.sql in Supabase first."
      );
    }
    throw new Error(`Failed to update paid status: ${error.message}`);
  }
}

/** Manual flag, tolerating databases where 0009 isn't applied yet. */
export function orderManualPaid(order: { is_paid?: boolean } | null | undefined): boolean {
  return Boolean(order?.is_paid);
}

/** Paid = manual tick OR linked transactions covering the order total. */
export function isOrderPaid(
  order: { is_paid?: boolean; total: number | string },
  paidSum: number
): boolean {
  if (orderManualPaid(order)) return true;
  return paidSum >= Number(order.total);
}

function formatFileSize(bytes: number): string {
  const kb = bytes / 1024;
  return kb < 1024
    ? `${Math.max(1, Math.round(kb))} KB`
    : `${(kb / 1024).toFixed(1)} MB`;
}

/** Upload to R2 via the /api/upload endpoint. */
async function uploadToR2(
  file: File,
  bucket: "catalog" | "customerdata",
  prefix: string
): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("bucket", bucket);
  form.append("prefix", prefix);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  const { url } = await res.json();
  return url;
}

/** Upload a photo to R2 (customerdata/images) and link it to the order. */
export async function addOrderPhoto(
  orderId: string,
  file: File,
  caption?: string
): Promise<OrderPhotoRow> {
  const url = await uploadToR2(file, "customerdata", `orders/${orderId}/images`);
  const { data, error } = await supabase
    .from("order_photos")
    .insert({ order_id: orderId, url, caption: caption ?? file.name })
    .select()
    .single();
  throwIf(error, "Failed to save photo");
  return data as OrderPhotoRow;
}

/** Upload a file to R2 (customerdata/files) and link it to the order. */
export async function addOrderDocument(
  orderId: string,
  file: File
): Promise<OrderDocumentRow> {
  const url = await uploadToR2(file, "customerdata", `orders/${orderId}/files`);
  const { data, error } = await supabase
    .from("order_documents")
    .insert({
      order_id: orderId,
      name: file.name,
      kind: "other",
      size_text: formatFileSize(file.size),
      url,
    })
    .select()
    .single();
  throwIf(error, "Failed to save document");
  return data as OrderDocumentRow;
}
