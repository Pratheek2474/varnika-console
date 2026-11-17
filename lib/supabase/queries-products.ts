import { supabase } from "./client";
import { ProductRow } from "./database.types";

function throwIf(error: unknown, action: string): void {
  if (error) throw new Error(`${action}: ${(error as Error).message}`);
}

export async function listProducts(): Promise<ProductRow[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name");
  throwIf(error, "Failed to load products");
  return (data ?? []) as ProductRow[];
}

export interface ProductInput {
  name: string;
  sku: string;
  category: string;
  subcategory: string;
  price: number;
  stock: number;
  image_url: string;
  images: string[];
  on_demand: boolean;
  material: string;
  featured: boolean;
}

export async function createProduct(input: ProductInput): Promise<ProductRow> {
  const { data, error } = await supabase
    .from("products")
    .insert(input)
    .select()
    .single();
  throwIf(error, "Failed to create product");
  return data as ProductRow;
}

export async function updateProduct(
  id: string,
  input: ProductInput
): Promise<void> {
  const { error } = await supabase.from("products").update(input).eq("id", id);
  throwIf(error, "Failed to update product");
}

const MAX_EDGE = 1600;
const WEBP_QUALITY = 0.82;

/** Shrink a photo to <=1600px on its longest side and re-encode as WebP.
 *  Falls back to the original file if anything goes wrong or it gets no smaller. */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", WEBP_QUALITY));
    if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, { type: "image/webp" });
  } catch {
    return file;
  }
}

/** Upload a catalog image to R2 (catalog/images). Falls back to Supabase. */
export async function uploadProductImage(original: File): Promise<string> {
  const file = await compressImage(original);
  const form = new FormData();
  form.append("file", file);
  form.append("bucket", "catalog");
  form.append("prefix", "images");
  const res = await fetch("/api/upload", { method: "POST", body: form });
  let json: { url?: string; error?: string; fallback?: boolean };
  try {
    json = await res.json();
  } catch {
    json = { error: `Upload failed (HTTP ${res.status})`, fallback: res.status >= 500 };
  }
  if (!res.ok) {
    if (json.fallback) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `images/${Date.now()}_${safeName}`;
      const { error: upError } = await supabase.storage
        .from("order-photos")
        .upload(path, file, { contentType: file.type || undefined });
      if (upError) throw new Error(`Supabase fallback upload failed: ${upError.message}`);
      const {
        data: { publicUrl },
      } = supabase.storage.from("order-photos").getPublicUrl(path);
      return publicUrl;
    }
    throw new Error(json.error ?? "Upload failed");
  }
  return json.url ?? "";
}
