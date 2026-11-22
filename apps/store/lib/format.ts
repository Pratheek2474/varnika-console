import type { Product } from "./types";

export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export const offPct = (p: Pick<Product, "price" | "mrp">) =>
  p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

export const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

/** "98480 00210" from any digits, for display. */
export const phoneShow = (p: string) => {
  const d = p.replace(/\D/g, "").slice(-10);
  return d.length === 10 ? `${d.slice(0, 5)} ${d.slice(5)}` : p;
};

export const phoneDigits = (p: string) => p.replace(/\D/g, "").slice(-10);

export const isNewProduct = (p: Pick<Product, "created_at">) =>
  Date.now() - new Date(p.created_at).getTime() < 30 * 86400000;

/** Soft brand gradients used when a product has no photo yet. */
const FALLBACKS = [
  "linear-gradient(165deg,#E9D3C8,#D7B4A6)",
  "linear-gradient(165deg,rgba(122,36,49,.86),rgba(74,14,25,.95))",
  "linear-gradient(165deg,rgba(201,154,82,.82),rgba(140,90,43,.92))",
  "linear-gradient(165deg,#F0D9DC,#DDB5BA)",
  "linear-gradient(165deg,rgba(84,120,102,.85),rgba(62,95,79,.95))",
  "linear-gradient(165deg,#EFE3D3,#DCC7A8)",
];
export const fallbackBg = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return FALLBACKS[h % FALLBACKS.length];
};

export const productImages = (p: Pick<Product, "images" | "image_url">): string[] =>
  p.images?.length ? p.images : p.image_url ? [p.image_url] : [];
