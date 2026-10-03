import { supabase } from "./client";
import {
  PaymentMode,
  ShipmentStatus,
  ShipmentWithMilestones,
  TicketStatus,
  TicketWithLinks,
  TransactionRow,
  TransactionWithLinks,
} from "./database.types";

function throwIf(error: unknown, action: string): void {
  if (error) throw new Error(`${action}: ${(error as Error).message}`);
}

// ─── Transactions ────────────────────────────────────────────────────────────

const TXN_SELECT =
  "*, customers (id, customer_name, email), orders (id, order_number)";

export async function listTransactions(): Promise<TransactionWithLinks[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select(TXN_SELECT)
    .order("occurred_at", { ascending: false });
  throwIf(error, "Failed to load transactions");
  return (data ?? []) as TransactionWithLinks[];
}

export interface TransactionInput {
  customer_id: string;
  order_id: string;
  amount: number;
  payment_mode: PaymentMode;
  payment_ref: string;
  date: string; // YYYY-MM-DD
}

export async function createTransaction(
  input: TransactionInput
): Promise<TransactionRow> {
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      customer_id: input.customer_id,
      order_id: input.order_id,
      amount: input.amount,
      currency: "USD",
      payment_mode: input.payment_mode,
      payment_ref: input.payment_ref,
      occurred_at: new Date(input.date).toISOString(),
    })
    .select()
    .single();
  throwIf(error, "Failed to create transaction");
  return data as TransactionRow;
}

export async function updateTransaction(
  id: string,
  input: TransactionInput
): Promise<void> {
  const { error } = await supabase
    .from("transactions")
    .update({
      customer_id: input.customer_id,
      order_id: input.order_id,
      amount: input.amount,
      payment_mode: input.payment_mode,
      payment_ref: input.payment_ref,
      occurred_at: new Date(input.date).toISOString(),
    })
    .eq("id", id);
  throwIf(error, "Failed to update transaction");
}

// ─── Shipments ───────────────────────────────────────────────────────────────

const SHIPMENT_SELECT =
  "*, shipment_milestones (*), orders (id, order_number, customers (id, customer_name))";

export async function listShipments(): Promise<ShipmentWithMilestones[]> {
  const { data, error } = await supabase
    .from("shipments")
    .select(SHIPMENT_SELECT)
    .order("created_at", { ascending: false });
  throwIf(error, "Failed to load shipments");
  const rows = (data ?? []) as ShipmentWithMilestones[];
  // Ensure milestones are position-ordered
  for (const row of rows) {
    row.shipment_milestones.sort((a, b) => a.position - b.position);
  }
  return rows;
}

export interface ShipmentInput {
  order_id: string;
  tracking_number: string;
  carrier: string;
  destination_city: string;
  address: string;
  status: ShipmentStatus;
  estimated_delivery: string;
}

/** Insert payload — drops `address` when the 0008 migration isn't applied yet. */
function shipmentPayload(input: ShipmentInput): Record<string, string> {
  return {
    order_id: input.order_id,
    tracking_number: input.tracking_number,
    carrier: input.carrier,
    destination_city: input.destination_city,
    address: input.address,
    status: input.status,
    estimated_delivery: input.estimated_delivery,
  };
}

function isMissingAddressColumn(error: unknown): boolean {
  const msg = (error as Error)?.message ?? "";
  return /address/i.test(msg) && /column|schema cache/i.test(msg);
}

async function insertInitialMilestones(
  shipmentId: string,
  milestone?: { status_text: string; location: string }
): Promise<void> {
  const milestones = milestone?.status_text
    ? [
        {
          shipment_id: shipmentId,
          position: 0,
          status_text: milestone.status_text,
          location: milestone.location,
          time_text: "Just now",
        },
      ]
    : [
        {
          shipment_id: shipmentId,
          position: 0,
          status_text: "Label Created",
          location: "Varnika Studio Vault",
          time_text: "Just now",
        },
      ];
  const { error: msError } = await supabase
    .from("shipment_milestones")
    .insert(milestones);
  throwIf(msError, "Failed to create shipment milestone");
}

export async function createShipment(
  input: ShipmentInput,
  milestone?: { status_text: string; location: string }
): Promise<void> {
  const { data: shipment, error } = await supabase
    .from("shipments")
    .insert(shipmentPayload(input))
    .select("id")
    .single();
  if (error && isMissingAddressColumn(error)) {
    // 0008 migration not applied yet — retry without the address column.
    const fallback = shipmentPayload(input);
    delete fallback.address;
    const retry = await supabase.from("shipments").insert(fallback).select("id").single();
    throwIf(retry.error, "Failed to create shipment");
    await insertInitialMilestones((retry.data as { id: string }).id, milestone);
    return;
  }
  throwIf(error, "Failed to create shipment");

  await insertInitialMilestones((shipment as { id: string }).id, milestone);
}

export async function updateShipment(
  id: string,
  input: ShipmentInput,
  milestone?: { status_text: string; location: string }
): Promise<void> {
  const payload = shipmentPayload(input);
  const { error } = await supabase.from("shipments").update(payload).eq("id", id);
  if (error && isMissingAddressColumn(error)) {
    // 0008 migration not applied yet — retry without the address column.
    delete payload.address;
    const retry = await supabase.from("shipments").update(payload).eq("id", id);
    throwIf(retry.error, "Failed to update shipment");
  } else {
    throwIf(error, "Failed to update shipment");
  }

  if (milestone?.status_text.trim()) {
    await addMilestone(id, milestone.status_text.trim(), milestone.location.trim());
  }
}

export async function addMilestone(
  shipmentId: string,
  statusText: string,
  location: string
): Promise<void> {
  // Newest milestones sort first (position ascending), so insert below current min
  const { data: existing } = await supabase
    .from("shipment_milestones")
    .select("position")
    .eq("shipment_id", shipmentId)
    .order("position", { ascending: true })
    .limit(1);
  const minPos =
    existing && existing.length > 0
      ? (existing[0] as { position: number }).position
      : 1;
  const { error } = await supabase.from("shipment_milestones").insert({
    shipment_id: shipmentId,
    position: minPos - 1,
    status_text: statusText,
    location,
    time_text: "Just now",
  });
  throwIf(error, "Failed to add milestone");
}

// ─── Tickets (read-only from external site; status updates only) ────────────

const TICKET_SELECT =
  "*, customers (id, customer_name), orders (id, order_number)";

export async function listTickets(): Promise<TicketWithLinks[]> {
  const { data, error } = await supabase
    .from("tickets")
    .select(TICKET_SELECT)
    .order("created_at", { ascending: false });
  throwIf(error, "Failed to load tickets");
  return (data ?? []) as TicketWithLinks[];
}

export async function updateTicketStatus(
  id: string,
  status: TicketStatus,
  lastMessage?: string
): Promise<void> {
  const patch: Record<string, string> = { status };
  if (typeof lastMessage === "string") patch.last_message = lastMessage;
  const { error } = await supabase.from("tickets").update(patch).eq("id", id);
  throwIf(error, "Failed to update ticket");
}
