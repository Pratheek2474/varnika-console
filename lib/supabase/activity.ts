import { supabase } from "./client";
import { ActivityAction, ActivityRow } from "./database.types";

export interface ActivityInput {
  actor: string;
  action: ActivityAction;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string;
  detail?: string;
  customerId?: string | null;
  customerName?: string;
  orderId?: string | null;
  orderNumber?: string;
}

/** Append one entry to the audit trail. Never throws — logging must not break saves. */
export async function logActivity(input: ActivityInput): Promise<void> {
  try {
    const { error } = await supabase.from("activity_log").insert({
      actor_name: input.actor,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      entity_label: input.entityLabel ?? "",
      detail: input.detail ?? "",
      customer_id: input.customerId ?? null,
      customer_name: input.customerName ?? "",
      order_id: input.orderId ?? null,
      order_number: input.orderNumber ?? "",
    });
    if (error) console.error("activity log failed:", error.message);
  } catch (e) {
    console.error("activity log failed:", e);
  }
}

export async function listActivity(limit = 100): Promise<ActivityRow[]> {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to load updates: ${error.message}`);
  return (data ?? []) as ActivityRow[];
}
