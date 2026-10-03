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

/** Upload a catalog image to R2 (catalog/images) and return public URL. */
export async function uploadProductImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("bucket", "catalog");
  form.append("prefix", "images");
  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  const { url } = await res.json();
  return url;
}
