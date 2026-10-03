/** Row types matching the Supabase schema (0001_varnika_init.sql). */

export type PriorityLevel = "low" | "medium" | "high";

export type OrderStatus =
  | "new"
  | "active"
  | "hold"
  | "dispatched"
  | "delivered";

export type PaymentMode =
  | "credit_card"
  | "debit_card"
  | "upi"
  | "bank_transfer"
  | "cash";

export type ShipmentStatus =
  | "shipped"
  | "in_transit"
  | "out_for_delivery"
  | "delivered";

export type TicketStatus = "open" | "in_progress" | "resolved";

export type DocumentKind =
  | "invoice"
  | "measurement_chart"
  | "design_sketch"
  | "receipt"
  | "shipping_label"
  | "other";

export type TimelineState = "completed" | "current" | "upcoming";

export interface MeasurementRow {
  id: string;
  label: string;
  blouse_length: number;
  shoulder: number;
  chest: number;
  waist: number;
  armhole: number;
  sleeve_length: number;
  sleeve_round: number;
  front_neck_deep: number;
  back_neck_deep: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerRow {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  avatar_url: string;
  measurement_id: string | null;
  special_notes: string;
  total_spent: number;
  orders_count: number;
  last_order_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerWithMeasurement extends CustomerRow {
  measurements: MeasurementRow | null;
}

export interface ProductRow {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  image_url: string;
  material: string;
  featured: boolean;
  measurement_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderRow {
  id: string;
  order_number: string;
  customer_id: string | null;
  item_summary: string;
  total: number;
  currency: string;
  status: OrderStatus;
  priority: PriorityLevel;
  delivery_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface OrderWithCustomer extends OrderRow {
  customers: {
    id: string;
    customer_name: string;
    email: string;
  } | null;
}

export interface TimelineEventRow {
  id: string;
  order_id: string;
  position: number;
  title: string;
  description: string | null;
  display_time: string | null;
  state: TimelineState;
  created_at: string;
}

export interface OrderPhotoRow {
  id: string;
  order_id: string;
  url: string;
  caption: string;
  uploaded_at: string;
}

export interface OrderDocumentRow {
  id: string;
  order_id: string;
  name: string;
  kind: DocumentKind;
  size_text: string;
  url: string;
  uploaded_at: string;
}

export interface TransactionRow {
  id: string;
  serial_number: number;
  customer_id: string | null;
  order_id: string | null;
  amount: number;
  currency: string;
  payment_mode: PaymentMode;
  payment_ref: string;
  occurred_at: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithLinks extends TransactionRow {
  customers: { id: string; customer_name: string; email: string } | null;
  orders: { id: string; order_number: string } | null;
}

export interface ShipmentRow {
  id: string;
  tracking_number: string;
  carrier: string;
  destination_city: string;
  recipient_name: string;
  order_id: string | null;
  status: ShipmentStatus;
  estimated_delivery: string;
  created_at: string;
  updated_at: string;
}

export interface ShipmentMilestoneRow {
  id: string;
  shipment_id: string;
  position: number;
  status_text: string;
  location: string;
  time_text: string;
  created_at: string;
}

export interface ShipmentWithMilestones extends ShipmentRow {
  shipment_milestones: ShipmentMilestoneRow[];
  orders: {
    id: string;
    order_number: string;
    customer_id: string | null;
  } | null;
}

export interface TicketRow {
  id: string;
  ticket_number: string;
  customer_id: string | null;
  order_id: string | null;
  subject: string;
  status: TicketStatus;
  assigned_to: string;
  last_message: string;
  created_at: string;
  updated_at: string;
}

export interface TicketWithLinks extends TicketRow {
  customers: { id: string; customer_name: string } | null;
  orders: { id: string; order_number: string } | null;
}
