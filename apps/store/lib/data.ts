import { supabase } from "./supabase";
import { STITCH_FEE, SHIPPING, MEASURE_FIELDS, type MeasureKey } from "./config";
import { phoneDigits } from "./format";
import type {
  Address,
  BagLine,
  ChatMessage,
  Customer,
  MeasurementSet,
  Order,
  OrderKind,
  Product,
} from "./types";

function fail(error: { message: string } | null, what: string): void {
  if (error) throw new Error(`${what}: ${error.message}`);
}

// ─── Catalog ────────────────────────────────────────────────────────────────

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  fail(error, "Could not load the catalog");
  return ((data ?? []) as Partial<Product>[]).map((p) => ({
    id: p.id!,
    name: p.name ?? "",
    sku: p.sku ?? "",
    category: p.category ?? "",
    subcategory: p.subcategory ?? "",
    price: Number(p.price) || 0,
    mrp: Number(p.mrp) || 0,
    stock: Number(p.stock) || 0,
    on_demand: Boolean(p.on_demand),
    image_url: p.image_url ?? "",
    images: p.images ?? [],
    material: p.material ?? "",
    description: p.description ?? "",
    occasions: p.occasions ?? [],
    featured: Boolean(p.featured),
    created_at: p.created_at ?? new Date().toISOString(),
  }));
}

// ─── Customer (linked to the signed-in phone number) ────────────────────────

const CUSTOMER_COLS = "id, customer_name, email, phone, measurement_id";

export async function ensureCustomer(userId: string, phone: string): Promise<Customer> {
  const mine = await supabase
    .from("customers")
    .select(CUSTOMER_COLS)
    .eq("auth_user_id", userId)
    .maybeSingle();
  fail(mine.error, "Could not load your account");
  if (mine.data) return mine.data as Customer;

  // A customer the boutique already created with this phone number: claim it.
  const digits = phoneDigits(phone);
  if (digits.length === 10) {
    const found = await supabase
      .from("customers")
      .select(CUSTOMER_COLS)
      .is("auth_user_id", null)
      .ilike("phone", `%${digits.slice(0, 5)}%${digits.slice(5)}`)
      .limit(1);
    fail(found.error, "Could not look up your account");
    const hit = (found.data ?? [])[0] as Customer | undefined;
    if (hit) {
      const upd = await supabase
        .from("customers")
        .update({ auth_user_id: userId })
        .eq("id", hit.id)
        .select(CUSTOMER_COLS)
        .single();
      fail(upd.error, "Could not link your account");
      return upd.data as Customer;
    }
  }

  const created = await supabase
    .from("customers")
    .insert({ auth_user_id: userId, customer_name: "", phone: digits, email: "" })
    .select(CUSTOMER_COLS)
    .single();
  fail(created.error, "Could not create your account");
  return created.data as Customer;
}

export async function updateCustomer(
  id: string,
  patch: { customer_name?: string; email?: string }
): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .update(patch)
    .eq("id", id)
    .select(CUSTOMER_COLS)
    .single();
  fail(error, "Could not save your details");
  return data as Customer;
}

// ─── Measurements ───────────────────────────────────────────────────────────

const M_COLS = `id, label, updated_at, ${MEASURE_FIELDS.map((f) => f.key).join(", ")}`;

export async function listMeasurements(c: Customer): Promise<MeasurementSet[]> {
  const filter = c.measurement_id
    ? `customer_id.eq.${c.id},id.eq.${c.measurement_id}`
    : `customer_id.eq.${c.id}`;
  const { data, error } = await supabase
    .from("measurements")
    .select(M_COLS)
    .or(filter)
    .order("updated_at", { ascending: false });
  fail(error, "Could not load measurements");
  return (data ?? []) as unknown as MeasurementSet[];
}

export async function saveMeasurement(
  c: Customer,
  id: string | null,
  label: string,
  values: Partial<Record<MeasureKey, number>>
): Promise<void> {
  const row: Record<string, unknown> = { label, ...values };
  if (id) {
    const { error } = await supabase
      .from("measurements")
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq("id", id);
    fail(error, "Could not save measurements");
    return;
  }
  const { data, error } = await supabase
    .from("measurements")
    .insert({ ...row, customer_id: c.id })
    .select("id")
    .single();
  fail(error, "Could not save measurements");
  if (!c.measurement_id) {
    await supabase
      .from("customers")
      .update({ measurement_id: (data as { id: string }).id })
      .eq("id", c.id);
  }
}

// ─── Addresses ──────────────────────────────────────────────────────────────

export async function listAddresses(customerId: string): Promise<Address[]> {
  const { data, error } = await supabase
    .from("customer_addresses")
    .select("id, label, full_name, phone, line, city, pincode")
    .eq("customer_id", customerId)
    .order("created_at");
  fail(error, "Could not load addresses");
  return (data ?? []) as Address[];
}

export async function addAddress(customerId: string, a: Omit<Address, "id">): Promise<Address> {
  const { data, error } = await supabase
    .from("customer_addresses")
    .insert({ customer_id: customerId, ...a })
    .select("id, label, full_name, phone, line, city, pincode")
    .single();
  fail(error, "Could not save the address");
  return data as Address;
}

export async function removeAddress(id: string): Promise<void> {
  const { error } = await supabase.from("customer_addresses").delete().eq("id", id);
  fail(error, "Could not remove the address");
}

export const addressText = (a: Address) =>
  `${a.full_name}, ${a.line}, ${a.city} ${a.pincode}, +91 ${a.phone}`;

// ─── Orders ─────────────────────────────────────────────────────────────────

const ORDER_SELECT =
  "id, order_number, item_summary, total, status, kind, is_paid, delivery_date, notes, created_at, " +
  "order_items (name, detail, qty, price), " +
  "order_timeline_events (id, position, title, description, display_time, state), " +
  "order_photos (id, url, caption), " +
  "shipments (tracking_number, carrier, status)";

function sortOrder(o: Order): Order {
  o.order_timeline_events = [...(o.order_timeline_events ?? [])].sort((a, b) => a.position - b.position);
  return o;
}

export async function listOrders(customerId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  fail(error, "Could not load your orders");
  return ((data ?? []) as unknown as Order[]).map(sortOrder);
}

export async function getOrder(id: string, customerId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", id)
    .eq("customer_id", customerId)
    .maybeSingle();
  fail(error, "Could not load the order");
  return data ? sortOrder(data as unknown as Order) : null;
}

async function nextOrderNumber(): Promise<string> {
  const { data, error } = await supabase.from("orders").select("order_number");
  fail(error, "Could not create an order number");
  let max = 8849;
  for (const row of (data ?? []) as { order_number: string }[]) {
    const n = parseInt(row.order_number.replace(/\D/g, ""), 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return `VAR-${max + 1}`;
}

function timelineFor(orderId: string, note: string) {
  const mk = (
    position: number,
    title: string,
    state: "completed" | "current" | "upcoming",
    display_time: string | null,
    description?: string
  ) => ({ order_id: orderId, position, title, state, display_time, description: description ?? null });
  return [
    mk(0, "Order Placed", "completed", "Just now", note),
    mk(1, "Active", "current", "Scheduled"),
    mk(2, "Hold Check", "upcoming", "Scheduled"),
    mk(3, "Dispatched", "upcoming", "Scheduled"),
    mk(4, "Delivered", "upcoming", "Scheduled"),
  ];
}

export const lineUnit = (p: Product, line: BagLine) => p.price + (line.mode === "stitch" ? STITCH_FEE : 0);

export async function placeOrder(input: {
  customer: Customer;
  lines: { product: Product; line: BagLine }[];
  address: Address;
}): Promise<Order> {
  const { customer, lines, address } = input;
  const stitched = lines.some((l) => l.line.mode === "stitch");
  const subtotal = lines.reduce((s, l) => s + lineUnit(l.product, l.line) * l.line.qty, 0);
  const total = subtotal + SHIPPING;
  const summary =
    lines[0].product.name + (lines.length > 1 ? ` + ${lines.length - 1} more` : "");
  const days = stitched ? 15 : 5;
  const due = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

  const orderNumber = await nextOrderNumber();
  const { data, error } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_id: customer.id,
      item_summary: summary,
      total,
      currency: "INR",
      status: "new",
      priority: "medium",
      delivery_date: due,
      notes: `Shipping ₹${SHIPPING} included in total.`,
      kind: stitched ? "stitch" : "ready",
      source: "app",
      ship_to: addressText(address),
    })
    .select("id")
    .single();
  fail(error, "Could not place the order");
  const orderId = (data as { id: string }).id;

  const tl = await supabase.from("order_timeline_events").insert(timelineFor(orderId, "Placed from the Varnika app."));
  fail(tl.error, "Could not create the order timeline");

  const items = await supabase.from("order_items").insert(
    lines.map((l, i) => ({
      order_id: orderId,
      position: i,
      name: l.product.name,
      detail: l.line.mode === "stitch" ? "Stitched to measurements" : `Standard size ${l.line.size}`,
      qty: l.line.qty,
      price: lineUnit(l.product, l.line),
    }))
  );
  fail(items.error, "Could not save the order items");

  const full = await getOrder(orderId, customer.id);
  return full as Order;
}

export interface StitchRequest {
  garment: string;
  measure: string;
  fabric: string;
  lining: string;
  neck: string;
  sleeve: string;
  notes: string;
  photos: File[];
}

export async function placeCustomRequest(customer: Customer, req: StitchRequest): Promise<Order> {
  const orderNumber = await nextOrderNumber();
  const notes = [
    `Custom request from the app`,
    `Garment: ${req.garment}`,
    `Measurements: ${req.measure}`,
    `Fabric: ${req.fabric}`,
    `Lining: ${req.lining}`,
    `Neck: ${req.neck}`,
    `Sleeves: ${req.sleeve}`,
    req.notes ? `Notes: ${req.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const { data, error } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_id: customer.id,
      item_summary: `Custom ${req.garment.toLowerCase()}`,
      total: 0,
      currency: "INR",
      status: "new",
      priority: "medium",
      delivery_date: null,
      notes,
      kind: "custom",
      source: "app",
    })
    .select("id")
    .single();
  fail(error, "Could not send the request");
  const orderId = (data as { id: string }).id;
  const tl = await supabase
    .from("order_timeline_events")
    .insert(timelineFor(orderId, "Custom request. Waiting for a quote."));
  fail(tl.error, "Could not create the request timeline");

  for (const file of req.photos) {
    const url = await uploadPhoto(file, `orders/${orderId}/images`);
    await supabase.from("order_photos").insert({ order_id: orderId, url, caption: "Reference" });
  }
  return (await getOrder(orderId, customer.id)) as Order;
}

// ─── Photos ─────────────────────────────────────────────────────────────────

const MAX_EDGE = 1600;

/** Shrink to <=1600px WebP; falls back to the original file. */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.82));
    if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
}

export async function uploadPhoto(original: File, prefix: string): Promise<string> {
  const file = await compressImage(original);
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) throw new Error("Please sign in to add photos.");
  const form = new FormData();
  form.append("file", file);
  form.append("prefix", prefix);
  const res = await fetch("/api/upload", { method: "POST", body: form, headers: { Authorization: `Bearer ${token}` } });
  const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !json.url) throw new Error(json.error ?? `Upload failed (HTTP ${res.status})`);
  return json.url;
}

// ─── Chat ───────────────────────────────────────────────────────────────────

export async function getConversationId(c: Customer, create: boolean): Promise<string | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id")
    .eq("customer_id", c.id)
    .order("last_message_at", { ascending: false })
    .limit(1);
  fail(error, "Could not open chat");
  const found = (data ?? [])[0] as { id: string } | undefined;
  if (found) return found.id;
  if (!create) return null;
  const made = await supabase
    .from("conversations")
    .insert({ customer_id: c.id, subject: `Chat with ${c.customer_name || "customer"}` })
    .select("id")
    .single();
  fail(made.error, "Could not open chat");
  return (made.data as { id: string }).id;
}

export async function listMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, sender, sender_name, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at");
  fail(error, "Could not load messages");
  return (data ?? []) as ChatMessage[];
}

export async function sendChat(c: Customer, text: string): Promise<void> {
  const convo = (await getConversationId(c, true)) as string;
  const { error } = await supabase.from("chat_messages").insert({
    conversation_id: convo,
    sender: "customer",
    sender_name: c.customer_name || "Customer",
    body: text,
  });
  fail(error, "Could not send the message");
  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", convo);
}

// ─── Store visit ────────────────────────────────────────────────────────────

export async function bookVisit(c: Customer, dateIso: string, slot: string, label: string): Promise<void> {
  const { error } = await supabase
    .from("store_visits")
    .insert({ customer_id: c.id, visit_on: dateIso, slot, status: "booked" });
  fail(error, "Could not book the visit");
  // The console has no visits screen yet, so the team also sees it in chat.
  await sendChat(c, `I've booked a store visit for ${label}, ${slot}, to get measured.`);
}

export async function latestVisit(customerId: string): Promise<{ visit_on: string; slot: string } | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("store_visits")
    .select("visit_on, slot")
    .eq("customer_id", customerId)
    .gte("visit_on", today)
    .order("visit_on")
    .limit(1);
  return ((data ?? [])[0] as { visit_on: string; slot: string } | undefined) ?? null;
}

export type { OrderKind };
