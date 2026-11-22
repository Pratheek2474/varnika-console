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
import { OrderRow, OrderStatus, PriorityLevel } from "@/lib/supabase/database.types";
import { OrderInput } from "@/lib/supabase/queries-orders";
import { Field, NumberField, inputCls, selectCls } from "./fields";

type PendingPhoto = { key: string; url: string; file: File; caption: string };
const PHOTO_KINDS = ["Design sketch", "Cloth sample", "Reference"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: OrderRow | null;
  customers: { id: string; customer_name: string }[];
  onSave: (values: OrderInput, photos: { file: File; caption: string }[]) => void;
}

const STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "active", label: "Active" },
  { value: "hold", label: "Hold" },
  { value: "dispatched", label: "Dispatched" },
  { value: "delivered", label: "Delivered" },
];

export function OrderFormDialog({ open, onOpenChange, initial, customers, onSave }: Props) {
  const [customerId, setCustomerId] = useState("");
  const [itemSummary, setItemSummary] = useState("");
  const [total, setTotal] = useState("");
  const [status, setStatus] = useState<OrderStatus>("new");
  const [priority, setPriority] = useState<PriorityLevel>("medium");
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);

  useEffect(() => {
    if (!open) return;
    setPhotos([]);
    if (initial) {
      setCustomerId(initial.customer_id ?? customers[0]?.id ?? "");
      setItemSummary(initial.item_summary);
      setTotal(Number(initial.total) ? String(Number(initial.total)) : "");
      setStatus(initial.status);
      setPriority(initial.priority);
      setDeliveryDate(initial.delivery_date ?? new Date().toISOString().slice(0, 10));
      setNotes(initial.notes);
    } else {
      setCustomerId(customers[0]?.id ?? "");
      setItemSummary("");
      setTotal("");
      setStatus("new");
      setPriority("medium");
      setDeliveryDate(new Date().toISOString().slice(0, 10));
      setNotes("");
    }
  }, [open, initial, customers]);

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const added = Array.from(files).map((file, i) => ({
      key: `${Date.now()}-${i}-${file.name}`,
      url: URL.createObjectURL(file),
      file,
      caption: "Reference",
    }));
    setPhotos((p) => [...p, ...added]);
  };
  const removePhoto = (key: string) =>
    setPhotos((p) => {
      const gone = p.find((x) => x.key === key);
      if (gone) URL.revokeObjectURL(gone.url);
      return p.filter((x) => x.key !== key);
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Order" : "Add Order"}</DialogTitle>
          <DialogDescription>
            {initial ? "Update order details and stage." : "Create a new order for a client."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2 text-xs">
          <Field label="Customer" className="col-span-2">
            <select className={selectCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.customer_name}</option>
              ))}
            </select>
          </Field>
          <Field label="Item Summary" className="col-span-2">
            <input className={inputCls} value={itemSummary} onChange={(e) => setItemSummary(e.target.value)} placeholder="Bespoke Blouse (Custom)" />
          </Field>

          <Field label="Total (₹)">
            <NumberField value={total} onChange={setTotal} placeholder="0" />
          </Field>
          <Field label="Delivery Date">
            <input type="date" className={inputCls} value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          </Field>
          <Field label="Status">
            <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select className={selectCls} value={priority} onChange={(e) => setPriority(e.target.value as PriorityLevel)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Field>
          <Field label="Notes" className="col-span-2">
            <textarea rows={2} className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>

          <Field label={initial ? "Add Photos" : "Photos"} className="col-span-2">
            <div className="space-y-2">
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((ph) => (
                    <div key={ph.key} className="space-y-1">
                      <div className="relative aspect-square border border-line rounded-xs overflow-hidden bg-ivory">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ph.url} alt={ph.caption} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(ph.key)}
                          className="absolute top-1 right-1 w-5 h-5 leading-none text-xs bg-white border border-line rounded-xs hover:border-wine"
                          title="Remove photo"
                        >
                          ×
                        </button>
                      </div>
                      <select
                        className={`${selectCls} !py-1 !text-[10px]`}
                        value={ph.caption}
                        onChange={(e) =>
                          setPhotos((p) => p.map((x) => (x.key === ph.key ? { ...x, caption: e.target.value } : x)))
                        }
                      >
                        {PHOTO_KINDS.map((k) => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
                    </div>
                  ))}
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
              <div className="text-[10px] text-neutral-400">
                Design sketches, cloth samples or references. Select several at once.
              </div>
            </div>
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="default"
            size="sm"
            disabled={!itemSummary.trim() || !customerId}
            onClick={() => {
              onSave({ customer_id: customerId, item_summary: itemSummary.trim(), total: Number(total) || 0, status, priority, delivery_date: deliveryDate, notes }, photos.map((p) => ({ file: p.file, caption: p.caption })));
              onOpenChange(false);
            }}
          >
            {initial ? "Save Changes" : "Add Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
