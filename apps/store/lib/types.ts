import type { MeasureKey } from "./config";

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  subcategory: string;
  price: number;
  mrp: number;
  stock: number;
  on_demand: boolean;
  image_url: string;
  images: string[];
  material: string;
  description: string;
  occasions: string[];
  featured: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  measurement_id: string | null;
}

export type MeasurementSet = {
  id: string;
  label: string;
  updated_at: string;
} & Record<MeasureKey, number>;

export interface Address {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  line: string;
  city: string;
  pincode: string;
}

export type OrderKind = "ready" | "stitch" | "custom";
export type OrderStatus = "new" | "active" | "hold" | "dispatched" | "delivered";

export interface TimelineEvent {
  id: string;
  position: number;
  title: string;
  description: string | null;
  display_time: string | null;
  state: "completed" | "current" | "upcoming";
}

export interface Order {
  id: string;
  order_number: string;
  item_summary: string;
  total: number;
  status: OrderStatus;
  kind: OrderKind;
  is_paid: boolean;
  delivery_date: string | null;
  notes: string;
  created_at: string;
  order_items?: { name: string; detail: string; qty: number; price: number }[];
  order_timeline_events?: TimelineEvent[];
  order_photos?: { id: string; url: string; caption: string }[];
  shipments?: { tracking_number: string; carrier: string; status: string }[];
}

export interface ChatMessage {
  id: string;
  sender: "customer" | "staff";
  sender_name: string;
  body: string;
  created_at: string;
}

export interface BagLine {
  productId: string;
  mode: "stitch" | "ready";
  size: string;
  qty: number;
}
