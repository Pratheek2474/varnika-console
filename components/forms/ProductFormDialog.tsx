"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProductRow } from "@/lib/supabase/database.types";
import { ProductInput } from "@/lib/supabase/queries-products";
import { Field, inputCls, selectCls } from "./fields";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: ProductRow | null;
  categories: string[];
  onSave: (values: ProductInput) => void;
}

export function ProductFormDialog({ open, onOpenChange, initial, categories, onSave }: Props) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [material, setMaterial] = useState("");
  const [featured, setFeatured] = useState(false);

  useEffect(() => {
    if (open) {
      if (initial) {
        setName(initial.name);
        setSku(initial.sku);
        setCategory(initial.category);
        setCustomCategory("");
        setPrice(Number(initial.price));
        setStock(initial.stock);
        setImageUrl(initial.image_url);
        setMaterial(initial.material);
        setFeatured(initial.featured);
      } else {
        setName("");
        setSku("");
        setCategory(categories[0] ?? "");
        setCustomCategory("");
        setPrice(0);
        setStock(0);
        setImageUrl("");
        setMaterial("");
        setFeatured(false);
      }
    }
  }, [open, initial, categories]);

  const finalCategory =
    category === "__custom" ? customCategory.trim() : category;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Product" : "Add Product"}</DialogTitle>
          <DialogDescription>
            {initial ? "Update catalog entry." : "Add a new garment to the catalog."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2 text-xs">
          <Field label="Name" className="col-span-2">
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Reversible Angora Cardigan" />
          </Field>
          <Field label="SKU">
            <input className={inputCls} value={sku} onChange={(e) => setSku(e.target.value)} placeholder="VAR-CRD-091" />
          </Field>
          <Field label="Category">
            <select className={selectCls} value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="__custom">+ New category…</option>
            </select>
          </Field>
          {category === "__custom" && (
            <Field label="New Category" className="col-span-2">
              <input className={inputCls} value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="e.g. Sarees" />
            </Field>
          )}
          <Field label="Price (USD)">
            <input type="number" min="0" className={inputCls} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </Field>
          <Field label="Stock">
            <input type="number" min="0" className={inputCls} value={stock} onChange={(e) => setStock(Number(e.target.value))} />
          </Field>
          <Field label="Image URL" className="col-span-2">
            <input className={inputCls} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          </Field>
          <Field label="Material" className="col-span-2">
            <input className={inputCls} value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="70% Angora, 30% Virgin Wool" />
          </Field>
          <label className="col-span-2 flex items-center gap-2 text-xs text-neutral-700">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="accent-black" />
            Featured product
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="default"
            size="sm"
            disabled={!name.trim() || !sku.trim() || !finalCategory}
            onClick={() => {
              onSave({
                name: name.trim(),
                sku: sku.trim(),
                category: finalCategory,
                price,
                stock,
                image_url: imageUrl,
                material,
                featured,
              });
              onOpenChange(false);
            }}
          >
            {initial ? "Save Changes" : "Add Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
