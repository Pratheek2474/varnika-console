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
import { Field, NumberField, inputCls, selectCls } from "./fields";

export const OCCASIONS = ["Wedding", "Festive", "Everyday", "Party", "Office"] as const;

export const CATALOG_CATEGORIES = ["Blouse", "Skirt", "Saree"] as const;

function isBlouseCategory(category: string): boolean {
  const c = category.trim().toLowerCase();
  return c === "blouse" || c === "blouses";
}

type Photo = { key: string; url: string; file?: File };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: ProductRow | null;
  categories: string[];
  onSave: (values: ProductInput) => void;
}

export function ProductFormDialog({ open, onOpenChange, initial, categories, onSave }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [description, setDescription] = useState("");
  const [occasions, setOccasions] = useState<string[]>([]);
  const [stock, setStock] = useState("");
  // Photos: existing URLs (kept) and newly chosen files (uploaded on save). First one is the cover.
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [onDemand, setOnDemand] = useState(false);
  const [material, setMaterial] = useState("");
  const [featured, setFeatured] = useState(false);

  useEffect(() => {
    if (open) {
      if (initial) {
        setName(initial.name);
        setCategory(initial.category);
        setCustomCategory("");
        setSubcategory(initial.subcategory || "");
        setPrice(Number(initial.price) ? String(Number(initial.price)) : "");
        setMrp(Number(initial.mrp) ? String(Number(initial.mrp)) : "");
        setDescription(initial.description ?? "");
        setOccasions(initial.occasions ?? []);
        setStock(initial.stock ? String(initial.stock) : "");
        const urls = initial.images?.length ? initial.images : initial.image_url ? [initial.image_url] : [];
        setPhotos(urls.map((u, i) => ({ key: `old-${i}-${u}`, url: u })));
        setOnDemand(Boolean(initial.on_demand));
        setUploadError(null);
        setMaterial(initial.material);
        setFeatured(initial.featured);
      } else {
        setName("");
        setCategory(categories[0] ?? "Blouse");
        setCustomCategory("");
        setSubcategory("");
        setPrice("");
        setMrp("");
        setDescription("");
        setOccasions([]);
        setStock("");
        setPhotos([]);
        setOnDemand(false);
        setUploadError(null);
        setMaterial("");
        setFeatured(false);
      }
    }
  }, [open, initial, categories]);

  const finalCategory =
    category === "__custom" ? customCategory.trim() : category;

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    const added = Array.from(files).map((file, i) => ({
      key: `new-${Date.now()}-${i}-${file.name}`,
      url: URL.createObjectURL(file),
      file,
    }));
    setPhotos((p) => [...p, ...added]);
  };

  const removePhoto = (key: string) => {
    setPhotos((p) => {
      const gone = p.find((x) => x.key === key);
      if (gone?.file) URL.revokeObjectURL(gone.url);
      return p.filter((x) => x.key !== key);
    });
  };

  const makeCover = (key: string) =>
    setPhotos((p) => {
      const hit = p.find((x) => x.key === key);
      return hit ? [hit, ...p.filter((x) => x.key !== key)] : p;
    });

  const handleSave = async () => {
    setUploadError(null);
    setUploading(true);
    let urls: string[];
    try {
      urls = await Promise.all(
        photos.map((ph) => (ph.file ? uploadProductImage(ph.file) : Promise.resolve(ph.url)))
      );
    } catch (e) {
      setUploading(false);
      setUploadError((e as Error).message);
      return;
    }
    setUploading(false);
    onSave({
      name: name.trim(),
      sku: initial?.sku ?? "",
      category: finalCategory,
      subcategory: isBlouseCategory(finalCategory) ? subcategory : "",
      price: Number(price) || 0,
      stock: onDemand ? 0 : Math.floor(Number(stock) || 0),
      on_demand: onDemand,
      mrp: Number(mrp) || 0,
      description: description.trim(),
      occasions,
      image_url: urls[0] ?? "",
      images: urls,
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
          <Field label="Name" className={initial ? "" : "col-span-2"}>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Reversible Angora Cardigan" />
          </Field>
          {initial && (
            <Field label="SKU">
              <div className={`${inputCls} bg-sunk text-neutral-500 font-mono`}>{initial.sku}</div>
            </Field>
          )}
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
          <Field label="Price (₹)">
            <NumberField value={price} onChange={setPrice} placeholder="0" />
          </Field>
          <Field label="MRP (₹, optional)">
            <NumberField value={mrp} onChange={setMrp} placeholder="Shows “% off” in the app" />
          </Field>
          <Field label="Stock">
            {onDemand ? (
              <div className={`${inputCls} text-neutral-400 bg-sunk`}>Made on demand</div>
            ) : (
              <NumberField value={stock} allowDecimals={false} onChange={setStock} placeholder="0" />
            )}
          </Field>
          <label className="col-span-2 flex items-center gap-2 text-xs text-neutral-700">
            <input type="checkbox" checked={onDemand} onChange={(e) => setOnDemand(e.target.checked)} className="accent-wine" />
            On demand (made to order, so inventory is not tracked or shown)
          </label>
          <Field label="Product Photos" className="col-span-2">
            <div className="space-y-2">
              {photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((ph, i) => (
                    <div key={ph.key} className="relative aspect-[3/4] border border-line rounded-xs overflow-hidden bg-ivory group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ph.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute top-1 left-1 text-[9px] px-1.5 py-0.5 bg-wine text-white rounded-xs">Cover</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(ph.key)}
                        className="absolute top-1 right-1 w-5 h-5 leading-none text-xs bg-white border border-line rounded-xs hover:border-wine"
                        title="Remove photo"
                      >
                        ×
                      </button>
                      {i !== 0 && (
                        <button
                          type="button"
                          onClick={() => makeCover(ph.key)}
                          className="absolute bottom-1 left-1 right-1 text-[9px] py-0.5 bg-white/90 border border-line rounded-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Make cover
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full aspect-[4/3] flex items-center justify-center text-[11px] text-neutral-400 border border-dashed border-line rounded-xs bg-ivory">
                  No photos yet. Choose files below.
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
                className="w-full text-xs text-neutral-600 file:mr-2 file:px-3 file:py-1.5 file:text-xs file:font-medium file:bg-sunk file:border file:border-line file:rounded-xs hover:file:border-wine file:cursor-pointer"
              />
              <div className="text-[10px] text-neutral-400">Select several at once. The first photo is the cover.</div>
              {uploadError && (
                <div className="text-[11px] text-red-600">{uploadError}</div>
              )}
            </div>
          </Field>
          <Field label="Occasions" className="col-span-2">
            <div className="flex flex-wrap gap-1.5">
              {OCCASIONS.map((o) => {
                const on = occasions.includes(o);
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setOccasions((p) => (on ? p.filter((x) => x !== o) : [...p, o]))}
                    className={`px-2.5 py-1 text-[11px] rounded-full border transition-colors ${on ? "bg-wine text-white border-wine" : "border-line text-neutral-600 hover:border-wine"}`}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Description (shown in the app)" className="col-span-2">
            <textarea rows={2} className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} />
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
            disabled={!name.trim() || !finalCategory || uploading}
            onClick={handleSave}
          >
            {uploading ? "Uploading…" : initial ? "Save Changes" : "Add Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
