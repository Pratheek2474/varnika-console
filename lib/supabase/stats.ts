import { supabase } from "./client";

function throwIf(error: unknown, action: string): void {
  if (error) throw new Error(`${action}: ${(error as Error).message}`);
}

export interface MonthBucket {
  key: string;
  label: string;
  revenue: number;
  count: number;
}

/** Last n calendar months, oldest first. Key format: YYYY-MM. */
export function lastMonths(n: number): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-US", { month: "short" }),
    });
  }
  return out;
}

export interface RevenueStats {
  /** Total of all paid orders. */
  gross: number;
  /** Number of paid orders. */
  count: number;
  /** Average paid order value. */
  avg: number;
  thisMonth: number;
  byMonth: MonthBucket[];
  /** Total of orders not yet marked paid. */
  outstanding: number;
  unpaidCount: number;
}

/** Revenue = orders marked as paid, bucketed by the month they were marked paid. */
export async function getRevenueStats(months = 6): Promise<RevenueStats> {
  const { data, error } = await supabase
    .from("orders")
    .select("total,is_paid,paid_at,created_at");
  throwIf(error, "Failed to load revenue stats");
  const rows = (data ?? []) as {
    total: number;
    is_paid: boolean;
    paid_at: string | null;
    created_at: string;
  }[];

  const byMonth: MonthBucket[] = lastMonths(months).map((m) => ({
    ...m,
    revenue: 0,
    count: 0,
  }));
  let gross = 0;
  let count = 0;
  let outstanding = 0;
  let unpaidCount = 0;
  for (const o of rows) {
    const amt = Number(o.total) || 0;
    if (!o.is_paid) {
      outstanding += amt;
      unpaidCount += 1;
      continue;
    }
    gross += amt;
    count += 1;
    const when = String(o.paid_at ?? o.created_at).slice(0, 7);
    const bucket = byMonth.find((b) => b.key === when);
    if (bucket) {
      bucket.revenue += amt;
      bucket.count += 1;
    }
  }

  return {
    gross,
    count,
    avg: count > 0 ? gross / count : 0,
    thisMonth: byMonth.length > 0 ? byMonth[byMonth.length - 1].revenue : 0,
    byMonth,
    outstanding,
    unpaidCount,
  };
}

export interface OrderStatRow {
  id: string;
  order_number: string;
  item_summary: string;
  total: number;
  status: string;
  delivery_date: string | null;
  created_at: string;
  customers: { id: string; customer_name: string } | null;
}

export interface OrderStats {
  total: number;
  active: number;
  byStatus: { status: string; count: number }[];
  recent: OrderStatRow[];
}

export async function getOrderStats(limit = 5): Promise<OrderStats> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,order_number,item_summary,total,status,delivery_date,created_at,customers (id,customer_name)"
    )
    .order("created_at", { ascending: false });
  throwIf(error, "Failed to load order stats");
  const rows = ((data ?? []) as unknown as (Omit<
    OrderStatRow,
    "customers"
  > & {
    customers:
      | { id: string; customer_name: string }
      | { id: string; customer_name: string }[]
      | null;
  })[]).map((o) => ({
    ...o,
    customers: Array.isArray(o.customers)
      ? (o.customers[0] ?? null)
      : (o.customers ?? null),
  }));
  const byStatus = new Map<string, number>();
  let active = 0;
  for (const o of rows) {
    byStatus.set(o.status, (byStatus.get(o.status) ?? 0) + 1);
    if (o.status !== "delivered") active += 1;
  }
  return {
    total: rows.length,
    active,
    byStatus: Array.from(byStatus.entries()).map(([status, count]) => ({
      status,
      count,
    })),
    recent: rows.slice(0, limit),
  };
}

export interface CustomerStats {
  total: number;
  withOrders: number;
  top: { name: string; total: number }[];
}

export async function getCustomerStats(): Promise<CustomerStats> {
  const { data, error } = await supabase
    .from("customers")
    .select("customer_name,total_spent,orders_count");
  throwIf(error, "Failed to load customer stats");
  const rows = (data ?? []) as {
    customer_name: string;
    total_spent: number;
    orders_count: number;
  }[];
  return {
    total: rows.length,
    withOrders: rows.filter((r) => Number(r.orders_count) > 0).length,
    top: rows
      .map((r) => ({ name: r.customer_name, total: Number(r.total_spent) || 0 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5),
  };
}

export async function getOpenChatsCount(): Promise<number> {
  const { count, error } = await supabase
    .from("conversations")
    .select("id", { count: "exact", head: true });
  throwIf(error, "Failed to load chat stats");
  return count ?? 0;
}

export interface NavCounts {
  /** Orders not yet delivered (pipeline). Null when unreadable. */
  ordersActive: number | null;
  /** Shipments not yet delivered. Null when unreadable. */
  inTransit: number | null;
  /** Month-over-month revenue growth, e.g. "+18%". Null when not computable. */
  revenueDelta: string | null;
  /** Open conversation count. Null when unreadable. */
  chats: number | null;
}

/**
 * Live sidebar/mobile badge numbers. Never throws — unreadable sources
 * come back null so the nav simply shows no badge instead of a wrong one.
 */
export async function getNavCounts(): Promise<NavCounts> {
  const out: NavCounts = {
    ordersActive: null,
    inTransit: null,
    revenueDelta: null,
    chats: null,
  };
  try {
    const { count, error } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .neq("status", "delivered");
    if (!error) out.ordersActive = count ?? 0;
  } catch {
    // Badge stays hidden
  }
  try {
    const { count, error } = await supabase
      .from("shipments")
      .select("id", { count: "exact", head: true })
      .neq("status", "delivered");
    if (!error) out.inTransit = count ?? 0;
  } catch {
    // Badge stays hidden
  }
  try {
    out.chats = await getOpenChatsCount();
  } catch {
    // Badge stays hidden
  }
  try {
    const now = new Date();
    const thisKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
    const { data, error } = await supabase
      .from("orders")
      .select("total,paid_at")
      .eq("is_paid", true)
      .gte("paid_at", `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}-01`);
    if (!error) {
      let thisMonth = 0;
      let lastMonth = 0;
      for (const t of (data ?? []) as { total: number; paid_at: string }[]) {
        const key = String(t.paid_at).slice(0, 7);
        if (key === thisKey) thisMonth += Number(t.total) || 0;
        else if (key === prevKey) lastMonth += Number(t.total) || 0;
      }
      if (lastMonth > 0) {
        const pct = Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
        out.revenueDelta = `${pct >= 0 ? "+" : ""}${pct}%`;
      }
    }
  } catch {
    // Badge stays hidden
  }
  return out;
}
