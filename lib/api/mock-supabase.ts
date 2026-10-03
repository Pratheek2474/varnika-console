import { Permission } from "../types/auth";

export interface LuxuryProduct {
  id: string;
  name: string;
  sku: string;
  category: "Apparel" | "Dress" | "Knitwear" | "Outer" | "Bags" | "Accessories";
  price: number;
  stock: number;
  imageUrl: string;
  material: string;
  featured?: boolean;
}

export interface OrderTicket {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  itemSummary: string;
  total: number;
  currency: string;
  status: "new" | "pattern_drafting" | "tailoring" | "quality_check" | "dispatched" | "delivered";
  priority: "normal" | "vip" | "rush";
  createdAt: string;
  deliveryDate: string;
  notes?: string;
}

export interface OrderTimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  state: "completed" | "current" | "upcoming";
}

export interface OrderPhoto {
  id: string;
  url: string;
  caption: string;
  uploadedAt: string;
}

export interface OrderDocument {
  id: string;
  name: string;
  kind: "invoice" | "measurement_chart" | "design_sketch" | "receipt" | "shipping_label";
  size: string;
  uploadedAt: string;
  url: string;
}

export interface OrderDetailContent {
  timeline: OrderTimelineEvent[];
  photos: OrderPhoto[];
  documents: OrderDocument[];
}

export interface CustomerMeasurementProfile {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  vipTier: "Black Diamond" | "Platinum Patron" | "Gold" | "Standard";
  totalSpent: number;
  ordersCount: number;
  lastOrderDate: string;
  avatarUrl: string;
  measurements: {
    bust: number; // inches
    waist: number;
    hips: number;
    shoulder: number;
    sleeveLength: number;
    inseam: number;
    height: string;
    fitPreference: "Bespoke Snug" | "Relaxed Tailored" | "Fluid Oversized";
  };
  specialNotes: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerId?: string;
  customerName: string;
  orderId?: string;
  orderNumber?: string;
  subject: string;
  category: "alteration" | "delivery_inquiry" | "styling_advice" | "custom_fabric";
  status: "open" | "in_progress" | "resolved";
  priority: "urgent" | "high" | "normal";
  createdAt: string;
  assignedTo: string;
  lastMessage: string;
}

export interface DeliveryShipment {
  id: string;
  trackingNumber: string;
  carrier: "DHL Express Luxury" | "FedEx Priority" | "BlueDart Studio Express";
  destinationCity: string;
  recipientName: string;
  orderId: string;
  status: "label_created" | "in_transit" | "out_for_delivery" | "delivered";
  estimatedDelivery: string;
  milestones: { time: string; location: string; status: string }[];
}

export interface Transaction {
  id: string;
  serialNumber: number;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  orderId: string;
  orderNumber: string;
  paymentMode: "credit_card" | "debit_card" | "upi" | "bank_transfer" | "cash" | "wallet";
  paymentRef: string;
  date: string;
  status: "completed" | "pending" | "failed" | "refunded";
}

// Mock Database Records
export const MOCK_PRODUCTS: LuxuryProduct[] = [
  {
    id: "prod_01",
    name: "2WN Reversible Angora Cardigan",
    sku: "VAR-CRD-091",
    category: "Knitwear",
    price: 120,
    stock: 24,
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80",
    material: "70% Angora, 30% Virgin Wool",
    featured: true,
  },
  {
    id: "prod_02",
    name: "Lame Reversible Angora Cardigan",
    sku: "VAR-CRD-092",
    category: "Knitwear",
    price: 120,
    stock: 18,
    imageUrl: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80",
    material: "Fine Gauge Cashmere & Lurex",
    featured: true,
  },
  {
    id: "prod_03",
    name: "Minimalist Oblong Structured Bag",
    sku: "VAR-BAG-104",
    category: "Bags",
    price: 240,
    stock: 8,
    imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80",
    material: "Full Grain Tuscan Calfskin",
    featured: true,
  },
  {
    id: "prod_04",
    name: "Sand Quilted Down Cocoon Parka",
    sku: "VAR-OUT-401",
    category: "Outer",
    price: 380,
    stock: 12,
    imageUrl: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80",
    material: "Waterproof Micro-faille & Goose Down",
    featured: true,
  },
  {
    id: "prod_05",
    name: "Ebony Mock Neck Merino Sweater",
    sku: "VAR-SWT-202",
    category: "Knitwear",
    price: 160,
    stock: 35,
    imageUrl: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80",
    material: "100% Extra-fine Merino",
  },
  {
    id: "prod_06",
    name: "Tailored Fluted Wool Crepe Maxi Dress",
    sku: "VAR-DRS-018",
    category: "Dress",
    price: 420,
    stock: 9,
    imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80",
    material: "Double Silk Georgette & Crepe",
  },
];

export const MOCK_ORDERS: OrderTicket[] = [
  {
    id: "ord_101",
    orderNumber: "VAR-8842",
    customerId: "cust_01",
    customerName: "Priya Sharma",
    customerEmail: "priya.sharma@couture.in",
    itemSummary: "Bespoke Fluted Wool Maxi Dress (Custom Measurement)",
    total: 420,
    currency: "USD",
    status: "tailoring",
    priority: "vip",
    createdAt: "2026-09-24T10:15:00Z",
    deliveryDate: "2026-09-29",
    notes: "Requires hand-finished scalloped hem. Fitting verified with Priya's stylist.",
  },
  {
    id: "ord_102",
    orderNumber: "VAR-8843",
    customerId: "cust_02",
    customerName: "Rahul Kapoor",
    customerEmail: "rahul.k@mumbaiholdings.com",
    itemSummary: "2WN Reversible Angora Cardigan + Oblong Bag",
    total: 360,
    currency: "USD",
    status: "pattern_drafting",
    priority: "normal",
    createdAt: "2026-09-25T14:30:00Z",
    deliveryDate: "2026-10-02",
    notes: "Gift packaging requested with embossed wax seal.",
  },
  {
    id: "ord_103",
    orderNumber: "VAR-8844",
    customerId: "cust_03",
    customerName: "Eleanor Vance",
    customerEmail: "eleanor.vance@atelier-paris.fr",
    itemSummary: "Sand Quilted Down Cocoon Parka (Size M)",
    total: 380,
    currency: "USD",
    status: "quality_check",
    priority: "rush",
    createdAt: "2026-09-25T08:00:00Z",
    deliveryDate: "2026-09-28",
    notes: "Rush air express for Milan Fashion Week presentation.",
  },
  {
    id: "ord_104",
    orderNumber: "VAR-8845",
    customerId: "cust_04",
    customerName: "Ananya Deshmukh",
    customerEmail: "ananya.d@studio-art.org",
    itemSummary: "Ebony Mock Neck Merino + Lame Cardigan",
    total: 280,
    currency: "USD",
    status: "dispatched",
    priority: "vip",
    createdAt: "2026-09-23T11:20:00Z",
    deliveryDate: "2026-09-27",
  },
  {
    id: "ord_105",
    orderNumber: "VAR-8846",
    customerId: "cust_05",
    customerName: "Devraj Singhania",
    customerEmail: "devraj@singhania.group",
    itemSummary: "Oblong Structured Bag (Tuscan Black)",
    total: 240,
    currency: "USD",
    status: "new",
    priority: "normal",
    createdAt: "2026-09-26T09:40:00Z",
    deliveryDate: "2026-10-04",
  },
  {
    id: "ord_106",
    orderNumber: "VAR-8840",
    customerId: "cust_06",
    customerName: "Zara Chen",
    customerEmail: "zara.chen@vogue-asia.com",
    itemSummary: "2WN Reversible Angora Cardigan (Emerald)",
    total: 120,
    currency: "USD",
    status: "delivered",
    priority: "vip",
    createdAt: "2026-09-21T16:00:00Z",
    deliveryDate: "2026-09-25",
  },
  {
    id: "ord_107",
    orderNumber: "VAR-8838",
    customerId: "cust_01",
    customerName: "Priya Sharma",
    customerEmail: "priya.sharma@couture.in",
    itemSummary: "2WN Reversible Angora Cardigan (Ivory)",
    total: 120,
    currency: "USD",
    status: "delivered",
    priority: "normal",
    createdAt: "2026-08-15T09:00:00Z",
    deliveryDate: "2026-08-22",
  },
  {
    id: "ord_108",
    orderNumber: "VAR-8835",
    customerId: "cust_02",
    customerName: "Rahul Kapoor",
    customerEmail: "rahul.k@mumbaiholdings.com",
    itemSummary: "Tailored Fluted Wool Crepe Maxi Dress",
    total: 420,
    currency: "USD",
    status: "delivered",
    priority: "normal",
    createdAt: "2026-07-28T11:00:00Z",
    deliveryDate: "2026-08-05",
  },
  {
    id: "ord_109",
    orderNumber: "VAR-8830",
    customerId: "cust_03",
    customerName: "Eleanor Vance",
    customerEmail: "eleanor.vance@atelier-paris.fr",
    itemSummary: "Minimalist Oblong Structured Bag (Chocolate)",
    total: 240,
    currency: "USD",
    status: "delivered",
    priority: "vip",
    createdAt: "2026-07-10T14:00:00Z",
    deliveryDate: "2026-07-18",
  },
  {
    id: "ord_110",
    orderNumber: "VAR-8828",
    customerId: "cust_04",
    customerName: "Ananya Deshmukh",
    customerEmail: "ananya.d@studio-art.org",
    itemSummary: "Sand Quilted Down Cocoon Parka (Size S)",
    total: 380,
    currency: "USD",
    status: "delivered",
    priority: "normal",
    createdAt: "2026-06-20T10:00:00Z",
    deliveryDate: "2026-06-28",
  },
];

// ─── Order Detail Content (Timeline, Photos, Documents) ─────────────────────

export const MOCK_ORDER_DETAILS: Record<string, OrderDetailContent> = {
  ord_101: {
    timeline: [
      { id: "evt_101_1", title: "Order Placed", description: "Bespoke Fluted Wool Maxi Dress commissioned with custom measurements.", timestamp: "Sep 24, 2026 · 10:15 AM", state: "completed" },
      { id: "evt_101_2", title: "Pattern Drafting", description: "Master tailor drafted pattern based on Priya's measurements.", timestamp: "Sep 25, 2026", state: "completed" },
      { id: "evt_101_3", title: "Tailoring In Progress", description: "Hand-stitching bodice and scalloped hem. Fitting verified with stylist.", timestamp: "Sep 26, 2026", state: "current" },
      { id: "evt_101_4", title: "Quality Check", timestamp: "Scheduled", state: "upcoming" },
      { id: "evt_101_5", title: "Dispatched", timestamp: "Scheduled", state: "upcoming" },
      { id: "evt_101_6", title: "Delivered", timestamp: "Target: Sep 29, 2026", state: "upcoming" },
    ],
    photos: [
      { id: "img_101_1", url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=400&q=80", caption: "Fabric selection — Double Silk Georgette", uploadedAt: "Sep 24, 2026" },
      { id: "img_101_2", url: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=400&q=80", caption: "Pattern drafting in progress", uploadedAt: "Sep 25, 2026" },
      { id: "img_101_3", url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=400&q=80", caption: "Tailoring workspace", uploadedAt: "Sep 26, 2026" },
    ],
    documents: [
      { id: "doc_101_1", name: "Invoice_VAR-8842.pdf", kind: "invoice", size: "245 KB", uploadedAt: "Sep 24, 2026", url: "#" },
      { id: "doc_101_2", name: "Measurement_Chart_Priya.pdf", kind: "measurement_chart", size: "180 KB", uploadedAt: "Sep 24, 2026", url: "#" },
      { id: "doc_101_3", name: "Design_Sketch_Fluted_Dress.pdf", kind: "design_sketch", size: "1.2 MB", uploadedAt: "Sep 25, 2026", url: "#" },
    ],
  },
  ord_102: {
    timeline: [
      { id: "evt_102_1", title: "Order Placed", description: "2WN Reversible Angora Cardigan + Oblong Bag combo.", timestamp: "Sep 25, 2026 · 2:30 PM", state: "completed" },
      { id: "evt_102_2", title: "Pattern Drafting", description: "Sourcing Angora wool and drafting cardigan pattern.", timestamp: "Sep 26, 2026", state: "current" },
      { id: "evt_102_3", title: "Tailoring", timestamp: "Scheduled", state: "upcoming" },
      { id: "evt_102_4", title: "Quality Check", timestamp: "Scheduled", state: "upcoming" },
      { id: "evt_102_5", title: "Dispatched", timestamp: "Scheduled", state: "upcoming" },
      { id: "evt_102_6", title: "Delivered", timestamp: "Target: Oct 2, 2026", state: "upcoming" },
    ],
    photos: [
      { id: "img_102_1", url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80", caption: "Angora wool selection", uploadedAt: "Sep 25, 2026" },
      { id: "img_102_2", url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80", caption: "Oblong bag leather selection", uploadedAt: "Sep 25, 2026" },
    ],
    documents: [
      { id: "doc_102_1", name: "Invoice_VAR-8843.pdf", kind: "invoice", size: "198 KB", uploadedAt: "Sep 25, 2026", url: "#" },
      { id: "doc_102_2", name: "Gift_Packaging_Request.pdf", kind: "receipt", size: "95 KB", uploadedAt: "Sep 25, 2026", url: "#" },
    ],
  },
  ord_103: {
    timeline: [
      { id: "evt_103_1", title: "Order Placed", description: "Rush order — Sand Quilted Down Cocoon Parka for Milan Fashion Week.", timestamp: "Sep 25, 2026 · 8:00 AM", state: "completed" },
      { id: "evt_103_2", title: "Pattern Drafting", description: "Expedited pattern drafting for Size M parka.", timestamp: "Sep 25, 2026", state: "completed" },
      { id: "evt_103_3", title: "Tailoring", description: "Quilting and down-filling in progress.", timestamp: "Sep 26, 2026", state: "completed" },
      { id: "evt_103_4", title: "Quality Check", description: "Final inspection and steam pressing.", timestamp: "Sep 27, 2026", state: "current" },
      { id: "evt_103_5", title: "Dispatched", timestamp: "Scheduled", state: "upcoming" },
      { id: "evt_103_6", title: "Delivered", timestamp: "Target: Sep 28, 2026", state: "upcoming" },
    ],
    photos: [
      { id: "img_103_1", url: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=400&q=80", caption: "Parka quilting detail", uploadedAt: "Sep 26, 2026" },
      { id: "img_103_2", url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80", caption: "Down-filling process", uploadedAt: "Sep 26, 2026" },
    ],
    documents: [
      { id: "doc_103_1", name: "Invoice_VAR-8844.pdf", kind: "invoice", size: "210 KB", uploadedAt: "Sep 25, 2026", url: "#" },
      { id: "doc_103_2", name: "Rush_Delivery_Label.pdf", kind: "shipping_label", size: "120 KB", uploadedAt: "Sep 27, 2026", url: "#" },
    ],
  },
  ord_104: {
    timeline: [
      { id: "evt_104_1", title: "Order Placed", description: "Ebony Mock Neck Merino + Lame Cardigan set.", timestamp: "Sep 23, 2026 · 11:20 AM", state: "completed" },
      { id: "evt_104_2", title: "Pattern Drafting", timestamp: "Sep 24, 2026", state: "completed" },
      { id: "evt_104_3", title: "Tailoring", timestamp: "Sep 25, 2026", state: "completed" },
      { id: "evt_104_4", title: "Quality Check", timestamp: "Sep 26, 2026", state: "completed" },
      { id: "evt_104_5", title: "Dispatched", description: "Handed to FedEx Priority — tracking FDX-PRIO-4819201.", timestamp: "Sep 26, 2026", state: "current" },
      { id: "evt_104_6", title: "Delivered", timestamp: "Target: Sep 27, 2026", state: "upcoming" },
    ],
    photos: [
      { id: "img_104_1", url: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=400&q=80", caption: "Merino sweater fitting", uploadedAt: "Sep 25, 2026" },
    ],
    documents: [
      { id: "doc_104_1", name: "Invoice_VAR-8845.pdf", kind: "invoice", size: "188 KB", uploadedAt: "Sep 23, 2026", url: "#" },
      { id: "doc_104_2", name: "Shipping_Label_FDX.pdf", kind: "shipping_label", size: "110 KB", uploadedAt: "Sep 26, 2026", url: "#" },
    ],
  },
  ord_105: {
    timeline: [
      { id: "evt_105_1", title: "Order Placed", description: "Oblong Structured Bag in Tuscan Black.", timestamp: "Sep 26, 2026 · 9:40 AM", state: "completed" },
      { id: "evt_105_2", title: "Pattern Drafting", timestamp: "Scheduled", state: "upcoming" },
      { id: "evt_105_3", title: "Tailoring", timestamp: "Scheduled", state: "upcoming" },
      { id: "evt_105_4", title: "Quality Check", timestamp: "Scheduled", state: "upcoming" },
      { id: "evt_105_5", title: "Dispatched", timestamp: "Scheduled", state: "upcoming" },
      { id: "evt_105_6", title: "Delivered", timestamp: "Target: Oct 4, 2026", state: "upcoming" },
    ],
    photos: [],
    documents: [
      { id: "doc_105_1", name: "Invoice_VAR-8846.pdf", kind: "invoice", size: "175 KB", uploadedAt: "Sep 26, 2026", url: "#" },
    ],
  },
  ord_106: {
    timeline: [
      { id: "evt_106_1", title: "Order Placed", description: "2WN Reversible Angora Cardigan in Emerald.", timestamp: "Sep 21, 2026 · 4:00 PM", state: "completed" },
      { id: "evt_106_2", title: "Pattern Drafting", timestamp: "Sep 22, 2026", state: "completed" },
      { id: "evt_106_3", title: "Tailoring", timestamp: "Sep 23, 2026", state: "completed" },
      { id: "evt_106_4", title: "Quality Check", timestamp: "Sep 24, 2026", state: "completed" },
      { id: "evt_106_5", title: "Dispatched", timestamp: "Sep 24, 2026", state: "completed" },
      { id: "evt_106_6", title: "Delivered", description: "Delivered to Zara Chen — signed and confirmed.", timestamp: "Sep 25, 2026", state: "completed" },
    ],
    photos: [
      { id: "img_106_1", url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=400&q=80", caption: "Finished cardigan — Emerald", uploadedAt: "Sep 24, 2026" },
    ],
    documents: [
      { id: "doc_106_1", name: "Invoice_VAR-8840.pdf", kind: "invoice", size: "165 KB", uploadedAt: "Sep 21, 2026", url: "#" },
      { id: "doc_106_2", name: "Receipt_VAR-8840.pdf", kind: "receipt", size: "88 KB", uploadedAt: "Sep 25, 2026", url: "#" },
    ],
  },
  ord_107: {
    timeline: [
      { id: "evt_107_1", title: "Order Placed", description: "2WN Reversible Angora Cardigan in Ivory.", timestamp: "Aug 15, 2026 · 9:00 AM", state: "completed" },
      { id: "evt_107_2", title: "Pattern Drafting", timestamp: "Aug 16, 2026", state: "completed" },
      { id: "evt_107_3", title: "Tailoring", timestamp: "Aug 18, 2026", state: "completed" },
      { id: "evt_107_4", title: "Quality Check", timestamp: "Aug 20, 2026", state: "completed" },
      { id: "evt_107_5", title: "Dispatched", timestamp: "Aug 21, 2026", state: "completed" },
      { id: "evt_107_6", title: "Delivered", description: "Delivered to Priya Sharma.", timestamp: "Aug 22, 2026", state: "completed" },
    ],
    photos: [
      { id: "img_107_1", url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80", caption: "Finished cardigan — Ivory", uploadedAt: "Aug 20, 2026" },
    ],
    documents: [
      { id: "doc_107_1", name: "Invoice_VAR-8838.pdf", kind: "invoice", size: "160 KB", uploadedAt: "Aug 15, 2026", url: "#" },
      { id: "doc_107_2", name: "Receipt_VAR-8838.pdf", kind: "receipt", size: "82 KB", uploadedAt: "Aug 22, 2026", url: "#" },
    ],
  },
  ord_108: {
    timeline: [
      { id: "evt_108_1", title: "Order Placed", description: "Tailored Fluted Wool Crepe Maxi Dress.", timestamp: "Jul 28, 2026 · 11:00 AM", state: "completed" },
      { id: "evt_108_2", title: "Pattern Drafting", timestamp: "Jul 29, 2026", state: "completed" },
      { id: "evt_108_3", title: "Tailoring", timestamp: "Aug 1, 2026", state: "completed" },
      { id: "evt_108_4", title: "Quality Check", timestamp: "Aug 3, 2026", state: "completed" },
      { id: "evt_108_5", title: "Dispatched", timestamp: "Aug 4, 2026", state: "completed" },
      { id: "evt_108_6", title: "Delivered", description: "Delivered to Rahul Kapoor.", timestamp: "Aug 5, 2026", state: "completed" },
    ],
    photos: [
      { id: "img_108_1", url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=400&q=80", caption: "Finished dress", uploadedAt: "Aug 3, 2026" },
    ],
    documents: [
      { id: "doc_108_1", name: "Invoice_VAR-8835.pdf", kind: "invoice", size: "172 KB", uploadedAt: "Jul 28, 2026", url: "#" },
      { id: "doc_108_2", name: "Receipt_VAR-8835.pdf", kind: "receipt", size: "85 KB", uploadedAt: "Aug 5, 2026", url: "#" },
    ],
  },
  ord_109: {
    timeline: [
      { id: "evt_109_1", title: "Order Placed", description: "Minimalist Oblong Structured Bag in Chocolate.", timestamp: "Jul 10, 2026 · 2:00 PM", state: "completed" },
      { id: "evt_109_2", title: "Pattern Drafting", timestamp: "Jul 11, 2026", state: "completed" },
      { id: "evt_109_3", title: "Tailoring", timestamp: "Jul 14, 2026", state: "completed" },
      { id: "evt_109_4", title: "Quality Check", timestamp: "Jul 16, 2026", state: "completed" },
      { id: "evt_109_5", title: "Dispatched", timestamp: "Jul 17, 2026", state: "completed" },
      { id: "evt_109_6", title: "Delivered", description: "Delivered to Eleanor Vance, Paris.", timestamp: "Jul 18, 2026", state: "completed" },
    ],
    photos: [
      { id: "img_109_1", url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80", caption: "Finished bag — Chocolate", uploadedAt: "Jul 16, 2026" },
    ],
    documents: [
      { id: "doc_109_1", name: "Invoice_VAR-8830.pdf", kind: "invoice", size: "155 KB", uploadedAt: "Jul 10, 2026", url: "#" },
      { id: "doc_109_2", name: "Receipt_VAR-8830.pdf", kind: "receipt", size: "78 KB", uploadedAt: "Jul 18, 2026", url: "#" },
    ],
  },
  ord_110: {
    timeline: [
      { id: "evt_110_1", title: "Order Placed", description: "Sand Quilted Down Cocoon Parka (Size S).", timestamp: "Jun 20, 2026 · 10:00 AM", state: "completed" },
      { id: "evt_110_2", title: "Pattern Drafting", timestamp: "Jun 21, 2026", state: "completed" },
      { id: "evt_110_3", title: "Tailoring", timestamp: "Jun 23, 2026", state: "completed" },
      { id: "evt_110_4", title: "Quality Check", timestamp: "Jun 25, 2026", state: "completed" },
      { id: "evt_110_5", title: "Dispatched", timestamp: "Jun 26, 2026", state: "completed" },
      { id: "evt_110_6", title: "Delivered", description: "Delivered to Ananya Deshmukh.", timestamp: "Jun 28, 2026", state: "completed" },
    ],
    photos: [
      { id: "img_110_1", url: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=400&q=80", caption: "Finished parka — Size S", uploadedAt: "Jun 25, 2026" },
    ],
    documents: [
      { id: "doc_110_1", name: "Invoice_VAR-8828.pdf", kind: "invoice", size: "168 KB", uploadedAt: "Jun 20, 2026", url: "#" },
      { id: "doc_110_2", name: "Receipt_VAR-8828.pdf", kind: "receipt", size: "80 KB", uploadedAt: "Jun 28, 2026", url: "#" },
    ],
  },
};

export const MOCK_CUSTOMERS: CustomerMeasurementProfile[] = [
  {
    id: "cust_01",
    customerName: "Priya Sharma",
    email: "priya.sharma@couture.in",
    phone: "+91 98201 44520",
    vipTier: "Black Diamond",
    totalSpent: 42500,
    ordersCount: 12,
    lastOrderDate: "2 days ago",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=128&q=80",
    measurements: {
      bust: 34.5,
      waist: 27.0,
      hips: 37.5,
      shoulder: 15.0,
      sleeveLength: 23.5,
      inseam: 31.0,
      height: "5' 8\"",
      fitPreference: "Bespoke Snug",
    },
    specialNotes: "Prefers pure natural silks and dry-clean-only linings. Avoid metallic zips against neck.",
  },
  {
    id: "cust_02",
    customerName: "Rahul Kapoor",
    email: "rahul.k@mumbaiholdings.com",
    phone: "+91 99300 81234",
    vipTier: "Platinum Patron",
    totalSpent: 18200,
    ordersCount: 4,
    lastOrderDate: "8 days ago",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80",
    measurements: {
      bust: 40.0,
      waist: 33.0,
      hips: 39.5,
      shoulder: 18.5,
      sleeveLength: 25.0,
      inseam: 32.5,
      height: "6' 0\"",
      fitPreference: "Relaxed Tailored",
    },
    specialNotes: "Orders luxury outerwear and bespoke knitwear for international winter travel.",
  },
  {
    id: "cust_03",
    customerName: "Eleanor Vance",
    email: "eleanor.vance@atelier-paris.fr",
    phone: "+33 6 40 22 91 00",
    vipTier: "Black Diamond",
    totalSpent: 63100,
    ordersCount: 19,
    lastOrderDate: "Yesterday",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80",
    measurements: {
      bust: 33.0,
      waist: 25.5,
      hips: 36.0,
      shoulder: 14.5,
      sleeveLength: 22.8,
      inseam: 30.5,
      height: "5' 7\"",
      fitPreference: "Fluid Oversized",
    },
    specialNotes: "Varnika ambassador patron. Requires urgent dispatch to Paris address during runway season.",
  },
  {
    id: "cust_04",
    customerName: "Ananya Deshmukh",
    email: "ananya.d@studio-art.org",
    phone: "+91 98110 22334",
    vipTier: "Gold",
    totalSpent: 8400,
    ordersCount: 3,
    lastOrderDate: "4 days ago",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80",
    measurements: {
      bust: 32.0,
      waist: 26.0,
      hips: 35.0,
      shoulder: 14.0,
      sleeveLength: 22.5,
      inseam: 30.0,
      height: "5' 6\"",
      fitPreference: "Relaxed Tailored",
    },
    specialNotes: "Prefers lightweight fabrics suitable for tropical climate.",
  },
  {
    id: "cust_05",
    customerName: "Devraj Singhania",
    email: "devraj@singhania.group",
    phone: "+91 98100 55667",
    vipTier: "Platinum Patron",
    totalSpent: 24800,
    ordersCount: 7,
    lastOrderDate: "1 day ago",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=128&q=80",
    measurements: {
      bust: 42.0,
      waist: 35.0,
      hips: 41.0,
      shoulder: 19.0,
      sleeveLength: 25.5,
      inseam: 33.0,
      height: "6' 1\"",
      fitPreference: "Bespoke Snug",
    },
    specialNotes: "Interested in monogram engraving and bespoke leather goods.",
  },
  {
    id: "cust_06",
    customerName: "Zara Chen",
    email: "zara.chen@vogue-asia.com",
    phone: "+852 9123 4567",
    vipTier: "Black Diamond",
    totalSpent: 52000,
    ordersCount: 15,
    lastOrderDate: "2 days ago",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=128&q=80",
    measurements: {
      bust: 31.5,
      waist: 24.5,
      hips: 34.5,
      shoulder: 13.5,
      sleeveLength: 22.0,
      inseam: 29.5,
      height: "5' 5\"",
      fitPreference: "Fluid Oversized",
    },
    specialNotes: "Fashion editor — requests editorial photography with each delivery.",
  },
];

export const MOCK_TICKETS: SupportTicket[] = [
  {
    id: "tkt_501",
    ticketNumber: "TCK-902",
    customerId: "cust_01",
    customerName: "Priya Sharma",
    orderId: "ord_101",
    orderNumber: "VAR-8842",
    subject: "Hem adjustment for gala gown order #VAR-8842",
    category: "alteration",
    status: "open",
    priority: "urgent",
    createdAt: "1 hour ago",
    assignedTo: "Master Tailor Anand",
    lastMessage: "Can we ensure the slit is 2 inches above the knee? My stylist has approved the shoes.",
  },
  {
    id: "tkt_502",
    ticketNumber: "TCK-903",
    customerId: "cust_05",
    customerName: "Devraj Singhania",
    orderId: "ord_105",
    orderNumber: "VAR-8846",
    subject: "Monogram engraving on Oblong Tuscan Bag",
    category: "styling_advice",
    status: "in_progress",
    priority: "normal",
    createdAt: "3 hours ago",
    assignedTo: "Leather Studio Concierge",
    lastMessage: "Would like initials 'DS' in gold foil heat-stamp on the interior pocket.",
  },
  {
    id: "tkt_503",
    ticketNumber: "TCK-904",
    customerId: "cust_06",
    customerName: "Zara Chen",
    orderId: "ord_106",
    orderNumber: "VAR-8840",
    subject: "Care instructions for Angora Cardigan storage",
    category: "styling_advice",
    status: "resolved",
    priority: "normal",
    createdAt: "1 day ago",
    assignedTo: "Fabric Care Specialist",
    lastMessage: "Provided cedarwood storage protocol and seasonal moth-proofing guidance.",
  },
];

export const MOCK_SHIPMENTS: DeliveryShipment[] = [
  {
    id: "shp_1",
    trackingNumber: "DHL-EXP-99241824",
    carrier: "DHL Express Luxury",
    destinationCity: "Paris, France",
    recipientName: "Eleanor Vance",
    orderId: "ord_103",
    status: "in_transit",
    estimatedDelivery: "Sep 28, 2026",
    milestones: [
      { time: "Sep 26 14:00", location: "Mumbai Air Hub", status: "Customs Clearance Complete" },
      { time: "Sep 25 18:30", location: "Varnika Studio Vault", status: "Handed over to Courier" },
    ],
  },
  {
    id: "shp_2",
    trackingNumber: "FDX-PRIO-4819201",
    carrier: "FedEx Priority",
    destinationCity: "New Delhi, India",
    recipientName: "Ananya Deshmukh",
    orderId: "ord_104",
    status: "out_for_delivery",
    estimatedDelivery: "Today by 4:00 PM",
    milestones: [
      { time: "Sep 26 09:15", location: "New Delhi Central Depo", status: "Out with Delivery Courier" },
      { time: "Sep 25 21:00", location: "IGI Air Cargo Hub", status: "Arrived at Sorting Facility" },
    ],
  },
];

export const MOCK_REVENUE_CHART = [
  { month: "Apr", revenue: 42000, orders: 110, apparel: 26000, bags: 12000, knitwear: 4000 },
  { month: "May", revenue: 58000, orders: 145, apparel: 34000, bags: 16000, knitwear: 8000 },
  { month: "Jun", revenue: 64000, orders: 162, apparel: 38000, bags: 18000, knitwear: 8000 },
  { month: "Jul", revenue: 71000, orders: 180, apparel: 41000, bags: 20000, knitwear: 10000 },
  { month: "Aug", revenue: 89000, orders: 220, apparel: 52000, bags: 25000, knitwear: 12000 },
  { month: "Sep", revenue: 112000, orders: 278, apparel: 68000, bags: 30000, knitwear: 14000 },
];

// ─── Transactions ─────────────────────────────────────────────────────────────

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "txn_001",
    serialNumber: 1,
    customerName: "Priya Sharma",
    customerEmail: "priya.sharma@couture.in",
    amount: 420,
    currency: "USD",
    orderId: "ord_101",
    orderNumber: "VAR-8842",
    paymentMode: "credit_card",
    paymentRef: "CC-2026-8842-001",
    date: "2026-09-24T10:15:00Z",
    status: "completed",
  },
  {
    id: "txn_002",
    serialNumber: 2,
    customerName: "Rahul Kapoor",
    customerEmail: "rahul.k@mumbaiholdings.com",
    amount: 360,
    currency: "USD",
    orderId: "ord_102",
    orderNumber: "VAR-8843",
    paymentMode: "upi",
    paymentRef: "UPI-2026-8843-002",
    date: "2026-09-25T14:30:00Z",
    status: "completed",
  },
  {
    id: "txn_003",
    serialNumber: 3,
    customerName: "Eleanor Vance",
    customerEmail: "eleanor.vance@atelier-paris.fr",
    amount: 380,
    currency: "USD",
    orderId: "ord_103",
    orderNumber: "VAR-8844",
    paymentMode: "bank_transfer",
    paymentRef: "BT-2026-8844-003",
    date: "2026-09-25T08:00:00Z",
    status: "completed",
  },
  {
    id: "txn_004",
    serialNumber: 4,
    customerName: "Ananya Deshmukh",
    customerEmail: "ananya.d@studio-art.org",
    amount: 280,
    currency: "USD",
    orderId: "ord_104",
    orderNumber: "VAR-8845",
    paymentMode: "credit_card",
    paymentRef: "CC-2026-8845-004",
    date: "2026-09-23T11:20:00Z",
    status: "completed",
  },
  {
    id: "txn_005",
    serialNumber: 5,
    customerName: "Devraj Singhania",
    customerEmail: "devraj@singhania.group",
    amount: 240,
    currency: "USD",
    orderId: "ord_105",
    orderNumber: "VAR-8846",
    paymentMode: "wallet",
    paymentRef: "WL-2026-8846-005",
    date: "2026-09-26T09:40:00Z",
    status: "completed",
  },
  {
    id: "txn_006",
    serialNumber: 6,
    customerName: "Zara Chen",
    customerEmail: "zara.chen@vogue-asia.com",
    amount: 120,
    currency: "USD",
    orderId: "ord_106",
    orderNumber: "VAR-8840",
    paymentMode: "credit_card",
    paymentRef: "CC-2026-8840-006",
    date: "2026-09-21T16:00:00Z",
    status: "completed",
  },
  {
    id: "txn_007",
    serialNumber: 7,
    customerName: "Priya Sharma",
    customerEmail: "priya.sharma@couture.in",
    amount: 120,
    currency: "USD",
    orderId: "ord_107",
    orderNumber: "VAR-8838",
    paymentMode: "upi",
    paymentRef: "UPI-2026-8838-007",
    date: "2026-08-15T09:00:00Z",
    status: "completed",
  },
  {
    id: "txn_008",
    serialNumber: 8,
    customerName: "Rahul Kapoor",
    customerEmail: "rahul.k@mumbaiholdings.com",
    amount: 420,
    currency: "USD",
    orderId: "ord_108",
    orderNumber: "VAR-8835",
    paymentMode: "bank_transfer",
    paymentRef: "BT-2026-8835-008",
    date: "2026-07-28T11:00:00Z",
    status: "completed",
  },
  {
    id: "txn_009",
    serialNumber: 9,
    customerName: "Eleanor Vance",
    customerEmail: "eleanor.vance@atelier-paris.fr",
    amount: 240,
    currency: "USD",
    orderId: "ord_109",
    orderNumber: "VAR-8830",
    paymentMode: "credit_card",
    paymentRef: "CC-2026-8830-009",
    date: "2026-07-10T14:00:00Z",
    status: "completed",
  },
  {
    id: "txn_010",
    serialNumber: 10,
    customerName: "Ananya Deshmukh",
    customerEmail: "ananya.d@studio-art.org",
    amount: 380,
    currency: "USD",
    orderId: "ord_110",
    orderNumber: "VAR-8828",
    paymentMode: "debit_card",
    paymentRef: "DC-2026-8828-010",
    date: "2026-06-20T10:00:00Z",
    status: "completed",
  },
  {
    id: "txn_011",
    serialNumber: 11,
    customerName: "Devraj Singhania",
    customerEmail: "devraj@singhania.group",
    amount: 180,
    currency: "USD",
    orderId: "ord_111",
    orderNumber: "VAR-8825",
    paymentMode: "upi",
    paymentRef: "UPI-2026-8825-011",
    date: "2026-05-15T13:00:00Z",
    status: "completed",
  },
  {
    id: "txn_012",
    serialNumber: 12,
    customerName: "Zara Chen",
    customerEmail: "zara.chen@vogue-asia.com",
    amount: 240,
    currency: "USD",
    orderId: "ord_112",
    orderNumber: "VAR-8820",
    paymentMode: "credit_card",
    paymentRef: "CC-2026-8820-012",
    date: "2026-04-10T15:30:00Z",
    status: "completed",
  },
  {
    id: "txn_013",
    serialNumber: 13,
    customerName: "Priya Sharma",
    customerEmail: "priya.sharma@couture.in",
    amount: 320,
    currency: "USD",
    orderId: "ord_113",
    orderNumber: "VAR-8818",
    paymentMode: "bank_transfer",
    paymentRef: "BT-2026-8818-013",
    date: "2026-03-05T10:00:00Z",
    status: "completed",
  },
  {
    id: "txn_014",
    serialNumber: 14,
    customerName: "Eleanor Vance",
    customerEmail: "eleanor.vance@atelier-paris.fr",
    amount: 560,
    currency: "USD",
    orderId: "ord_114",
    orderNumber: "VAR-8815",
    paymentMode: "credit_card",
    paymentRef: "CC-2026-8815-014",
    date: "2026-02-12T09:00:00Z",
    status: "completed",
  },
  {
    id: "txn_015",
    serialNumber: 15,
    customerName: "Rahul Kapoor",
    customerEmail: "rahul.k@mumbaiholdings.com",
    amount: 190,
    currency: "USD",
    orderId: "ord_115",
    orderNumber: "VAR-8810",
    paymentMode: "wallet",
    paymentRef: "WL-2026-8810-015",
    date: "2026-01-20T14:00:00Z",
    status: "completed",
  },
];

/**
 * Simulated Backend Edge Function / API Gateway (Supabase Edge Function Simulator)
 * Validates permissions independently of the UI frontend.
 */
export async function mockSupabaseEdgeFunction<T>(
  endpoint: string,
  requiredPermission: Permission,
  userPermissions: Permission[],
  dataResolver: () => T
): Promise<{ status: 200; data: T } | { status: 403; error: string; requiredPermission: string }> {
  // Simulate network latency (50ms - 150ms)
  await new Promise((resolve) => setTimeout(resolve, 80));

  if (!userPermissions.includes(requiredPermission)) {
    return {
      status: 403,
      error: `Access Denied by Edge Security Gateway: Missing '${requiredPermission}' authority.`,
      requiredPermission,
    };
  }

  return {
    status: 200,
    data: dataResolver(),
  };
}
