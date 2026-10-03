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
import { ProductInput, uploadProductImage } from "@/lib/supabase/queries-products";
import { Field, inputCls, selectCls } from "./fields";

export const CATALOG_CATEGORIES = ["Blouse", "Skirt", "Saree"] as const;

function isBlouseCategory(category: string): boolean {
  const c = category.trim().toLowerCase();
  return c === "blouse" || c === "blouses";
}

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
  const [subcategory, setSubcategory] = useState("");
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [material, setMaterial] = useState("");
  const [featured, setFeatured] = useState(false);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    if (open) {
      if (initial) {
        setName(initial.name);
        setSku(initial.sku);
        setCategory(initial.category);
        setCustomCategory("");
        setSubcategory(initial.subcategory || "");
        setPrice(Number(initial.price));
        setStock(initial.stock);
        setImageUrl(initial.image_url);
        setImageFile(null);
        setImagePreview(initial.image_url);
        setUploadError(null);
        setMaterial(initial.material);
        setFeatured(initial.featured);
      } else {
        setName("");
        setSku("");
        setCategory(categories[0] ?? "Blouse");
        setCustomCategory("");
        setSubcategory("");
        setPrice(0);
        setStock(0);
        setImageUrl("");
        setImageFile(null);
        setImagePreview("");
        setUploadError(null);
        setMaterial("");
        setFeatured(false);
      }
    }
  }, [open, initial, categories]);

  const finalCategory =
    category === "__custom" ? customCategory.trim() : category;

  const handleFileChange = (file: File | undefined) => {
    if (!file) return;
    setImageFile(file);
    setUploadError(null);
    if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setUploadError(null);
    let finalImageUrl = imageUrl;
    if (imageFile) {
      setUploading(true);
      try {
        finalImageUrl = await uploadProductImage(imageFile);
      } catch (e) {
        setUploading(false);
        setUploadError((e as Error).message);
        return;
      }
      setUploading(false);
    }
    onSave({
      name: name.trim(),
      sku: sku.trim(),
      category: finalCategory,
      subcategory: isBlouseCategory(finalCategory) ? subcategory : "",
      price,
      stock,
      image_url: finalImageUrl,
      material,
      featured,
    });
    onOpenChange(false);
  };

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
          {isBlouseCategory(category) && (
            <Field label="Sub-Type" className="col-span-2">
              <select
                className={selectCls}
                value={["Plain", "Work"].includes(subcategory) ? subcategory : ""}
                onChange={(e) => setSubcategory(e.target.value)}
              >
                <option value="">— None —</option>
                <option value="Plain">Plain</option>
                <option value="Work">Work</option>
              </select>
            </Field>
          )}
          <Field label="Price (USD)">
            <input type="number" min="0" className={inputCls} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </Field>
          <Field label="Stock">
            <input type="number" min="0" className={inputCls} value={stock} onChange={(e) => setStock(Number(e.target.value))} />
          </Field>
          <Field label="Product Image" className="col-span-2">
            <div className="space-y-2">
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="w-full aspect-[4/3] object-cover border border-[#E6E3DB] rounded-xs bg-[#F7F5F0]"
                />
              ) : (
                <div className="w-full aspect-[4/3] flex items-center justify-center text-[11px] text-neutral-400 border border-dashed border-[#E6E3DB] rounded-xs bg-[#F7F5F0]">
                  No image yet — choose a file below.
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
                className="w-full text-xs text-neutral-600 file:mr-2 file:px-3 file:py-1.5 file:text-xs file:font-medium file:bg-[#F4F2ED] file:border file:border-[#E6E3DB] file:rounded-xs hover:file:border-black file:cursor-pointer"
              />
              {uploadError && (
                <div className="text-[11px] text-red-600">{uploadError}</div>
              )}
            </div>
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
            disabled={!name.trim() || !sku.trim() || !finalCategory || uploading}
            onClick={handleSave}
          >
            {uploading ? "Uploading…" : initial ? "Save Changes" : "Add Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
