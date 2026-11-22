import type { Order, TimelineEvent } from "./types";
import { shortDate } from "./format";

export type OrderUi = "progress" | "hold" | "quote" | "delivered";

export const orderUi = (o: Order): OrderUi =>
  o.status === "delivered"
    ? "delivered"
    : o.kind === "custom" && Number(o.total) === 0
    ? "quote"
    : o.status === "hold"
    ? "hold"
    : "progress";

const TITLES: Record<string, string> = {
  "Order Placed": "Order placed",
  Active: "Being made",
  "Hold Check": "On hold",
  Dispatched: "Shipped",
  Delivered: "Delivered",
};
export const stepTitle = (t: string, o: Order) =>
  t === "Active" && o.kind === "ready" ? "Being packed" : (TITLES[t] ?? t);

/** Timeline steps a customer should see ("Hold Check" only while on hold). */
export function visibleSteps(o: Order): TimelineEvent[] {
  return (o.order_timeline_events ?? []).filter((t) => t.title !== "Hold Check" || o.status === "hold");
}

export function stateLabel(o: Order): string {
  const ui = orderUi(o);
  if (ui === "hold") return "On hold";
  if (ui === "delivered") return "Delivered";
  if (ui === "quote") return "Awaiting quote";
  const cur = visibleSteps(o).find((t) => t.state === "current") ?? visibleSteps(o)[0];
  return cur ? stepTitle(cur.title, o) : "In progress";
}

export function progressPct(o: Order): number {
  const steps = visibleSteps(o);
  if (!steps.length) return 10;
  const done = steps.filter((t) => t.state === "completed").length;
  return Math.min(100, Math.round(((done + 0.5) / steps.length) * 100));
}

export const etaText = (o: Order) => (o.delivery_date ? `Ready by ${shortDate(o.delivery_date)}` : "We'll confirm the date soon");

export const isActive = (o: Order) => o.status !== "delivered";
