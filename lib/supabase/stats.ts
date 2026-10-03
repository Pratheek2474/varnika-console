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
  gross: number;
  count: number;
  avg: number;
  thisMonth: number;
  byMonth: MonthBucket[];
  byMode: { mode: string; total: number; count: number }[];
}

export async function getRevenueStats(months = 6): Promise<RevenueStats> {
  const { data, error } = await supabase
    .from("transactions")
    .select("amount,occurred_at,payment_mode");
  throwIf(error, "Failed to load revenue stats");
  const rows = (data ?? []) as {
    amount: number;
    occurred_at: string;
    payment_mode: string;
  }[];

  const byMonth: MonthBucket[] = lastMonths(months).map((m) => ({
    ...m,
    revenue: 0,
    count: 0,
  }));
  const byMode = new Map<string, { mode: string; total: number; count: number }>();
  let gross = 0;
  for (const t of rows) {
    const amt = Number(t.amount) || 0;
    gross += amt;
    const bucket = byMonth.find((b) => b.key === String(t.occurred_at).slice(0, 7));
    if (bucket) {
      bucket.revenue += amt;
      bucket.count += 1;
    }
    const m = byMode.get(t.payment_mode) ?? {
      mode: t.payment_mode,
      total: 0,
      count: 0,
    };
    m.total += amt;
    m.count += 1;
    byMode.set(t.payment_mode, m);
  }

  return {
    gross,
    count: rows.length,
    avg: rows.length > 0 ? gross / rows.length : 0,
    thisMonth: byMonth.length > 0 ? byMonth[byMonth.length - 1].revenue : 0,
    byMonth,
    byMode: Array.from(byMode.values()),
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
