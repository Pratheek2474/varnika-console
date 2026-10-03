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

/** Upload a catalog image to R2 (catalog/images). Falls back to Supabase. */
export async function uploadProductImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("bucket", "catalog");
  form.append("prefix", "images");
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const json = await res.json();
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
    throw new Error(json.error || "Upload failed");
  }
  return json.url;
}
