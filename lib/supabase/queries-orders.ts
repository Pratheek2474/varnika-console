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
