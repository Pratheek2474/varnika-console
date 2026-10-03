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
import { Field, inputCls, selectCls } from "./fields";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: OrderRow | null;
  customers: { id: string; customer_name: string }[];
  onSave: (values: OrderInput) => void;
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
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<OrderStatus>("new");
  const [priority, setPriority] = useState<PriorityLevel>("medium");
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      if (initial) {
        setCustomerId(initial.customer_id ?? customers[0]?.id ?? "");
        setItemSummary(initial.item_summary);
        setTotal(Number(initial.total));
        setStatus(initial.status);
        setPriority(initial.priority);
        setDeliveryDate(initial.delivery_date ?? new Date().toISOString().slice(0, 10));
        setNotes(initial.notes);
      } else {
        setCustomerId(customers[0]?.id ?? "");
        setItemSummary("");
        setTotal(0);
        setStatus("new");
        setPriority("medium");
        setDeliveryDate(new Date().toISOString().slice(0, 10));
        setNotes("");
      }
    }
  }, [open, initial, customers]);

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
          <Field label="Total (USD)">
            <input type="number" min="0" className={inputCls} value={total} onChange={(e) => setTotal(Number(e.target.value))} />
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
              onSave({ customer_id: customerId, item_summary: itemSummary.trim(), total, status, priority, delivery_date: deliveryDate, notes });
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
