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
