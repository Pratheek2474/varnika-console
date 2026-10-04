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
import { OrderRow, OrderStatus, PriorityLevel, OrderItemInput } from "@/lib/supabase/database.types";
import { OrderInput, listOrderItems } from "@/lib/supabase/queries-orders";
import { Field, NumberField, inputCls, selectCls } from "./fields";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: OrderRow | null;
  customers: { id: string; customer_name: string }[];
  onSave: (values: OrderInput, items: OrderItemInput[]) => void;
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
  const [items, setItems] = useState<{ name: string; detail: string; qty: string; price: string }[]>([{ name: "", detail: "", qty: "", price: "" }]);
  const [total, setTotal] = useState("");
  const [status, setStatus] = useState<OrderStatus>("new");
  const [priority, setPriority] = useState<PriorityLevel>("medium");
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setCustomerId(initial.customer_id ?? customers[0]?.id ?? "");
      setItemSummary(initial.item_summary);
      setTotal(Number(initial.total) ? String(Number(initial.total)) : "");
      setStatus(initial.status);
      setPriority(initial.priority);
      setDeliveryDate(initial.delivery_date ?? new Date().toISOString().slice(0, 10));
      setNotes(initial.notes);
      setItems([{ name: "", detail: "", qty: "", price: "" }]);
      listOrderItems(initial.id).then((rows) => {
        if (rows.length > 0) {
          setItems(rows.map((r) => ({ name: r.name, detail: r.detail, qty: String(Number(r.qty)), price: String(Number(r.price)) })));
          setTotal(String(rows.reduce((s, r) => s + Number(r.qty) * Number(r.price), 0)));
        }
      });
    } else {
      setCustomerId(customers[0]?.id ?? "");
      setItemSummary("");
      setItems([{ name: "", detail: "", qty: "", price: "" }]);
      setTotal("");
      setStatus("new");
      setPriority("medium");
      setDeliveryDate(new Date().toISOString().slice(0, 10));
      setNotes("");
    }
  }, [open, initial, customers]);

  const itemsTotal = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0);
  const namedItems: OrderItemInput[] = items
    .filter((i) => i.name.trim())
    .map((i) => ({ name: i.name.trim(), detail: i.detail.trim(), qty: Number(i.qty) || 0, price: Number(i.price) || 0 }));

  const updateItem = (idx: number, patch: Partial<{ name: string; detail: string; qty: string; price: string }>) => {
    setItems((prev) => {
      const next = prev.map((it, j) => (j === idx ? { ...it, ...patch } : it));
      const sum = next.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0);
      if (next.some((i) => i.name.trim())) setTotal(sum ? String(sum) : "");
      return next;
    });
  };

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

          {/* Order Contents — line items */}
          <div className="col-span-2 space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-neutral-600">Order Contents</span>
              <button
                type="button"
                onClick={() => setItems((prev) => [...prev, { name: "", detail: "", qty: "", price: "" }])}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-black hover:underline"
              >
                <Plus className="w-3 h-3" /> Add item
              </button>
            </div>
            {items.map((it, idx) => (
              <div key={idx} className="p-2 bg-[#FAF9F6] border border-[#E6E3DB] rounded-xs space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    className={inputCls}
                    value={it.name}
                    onChange={(e) => updateItem(idx, { name: e.target.value })}
                    placeholder={`Item ${idx + 1} — e.g. Silk Blouse`}
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setItems((prev) => prev.filter((_, j) => j !== idx))}
                      className="p-1.5 text-neutral-400 hover:text-red-600 shrink-0"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    className={inputCls}
                    value={it.detail}
                    onChange={(e) => updateItem(idx, { detail: e.target.value })}
                    placeholder="Details (fabric, size…)"
                  />
                  <NumberField
                    value={it.qty}
                    allowDecimals={false}
                    onChange={(v) => updateItem(idx, { qty: v })}
                    placeholder="Qty"
                  />
                  <NumberField
                    value={it.price}
                    onChange={(v) => updateItem(idx, { price: v })}
                    placeholder="Price"
                  />
                </div>
              </div>
            ))}
            {namedItems.length > 0 && (
              <div className="text-[11px] font-mono text-neutral-500 text-right">
                Items total: {itemsTotal.toFixed(0)}
              </div>
            )}
          </div>

          <Field label="Total (USD)">
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
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="default"
            size="sm"
            disabled={!itemSummary.trim() || !customerId}
            onClick={() => {
              onSave({ customer_id: customerId, item_summary: itemSummary.trim(), total: Number(total) || 0, status, priority, delivery_date: deliveryDate, notes }, namedItems);
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
