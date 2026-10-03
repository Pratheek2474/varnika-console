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

/** Upload a catalog image to the order-photos bucket, returns public URL. */
export async function uploadProductImage(file: File): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `products/${Date.now()}_${safeName}`;
  const { error } = await supabase.storage
    .from("order-photos")
    .upload(path, file, { contentType: file.type || undefined });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  const {
    data: { publicUrl },
  } = supabase.storage.from("order-photos").getPublicUrl(path);
  return publicUrl;
}
