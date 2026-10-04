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
import { PaymentMode, TransactionWithLinks } from "@/lib/supabase/database.types";
import { TransactionInput } from "@/lib/supabase/queries-ops";
import { Field, NumberField, inputCls, selectCls } from "./fields";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: TransactionWithLinks | null;
  customers: { id: string; customer_name: string }[];
  orders: { id: string; order_number: string; customer_id: string | null; total: number }[];
  onSave: (values: TransactionInput) => void;
}

export function TransactionFormDialog({ open, onOpenChange, initial, customers, orders, onSave }: Props) {
  const [customerId, setCustomerId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("upi");
  const [paymentRef, setPaymentRef] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (open) {
      if (initial) {
        setCustomerId(initial.customer_id ?? customers[0]?.id ?? "");
        setOrderId(initial.order_id ?? orders[0]?.id ?? "");
        setAmount(Number(initial.amount) ? String(Number(initial.amount)) : "");
        setPaymentMode(initial.payment_mode);
        setPaymentRef(initial.payment_ref);
        setDate(initial.occurred_at.slice(0, 10));
      } else {
        setCustomerId(customers[0]?.id ?? "");
        const firstOrder = orders[0];
        setOrderId(firstOrder?.id ?? "");
        setAmount(Number(firstOrder?.total) ? String(Number(firstOrder?.total)) : "");
        setPaymentMode("upi");
        setPaymentRef("");
        setDate(new Date().toISOString().slice(0, 10));
      }
    }
  }, [open, initial, customers, orders]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
          <DialogDescription>Link payment to a customer and order.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2 text-xs">
          <Field label="Customer">
            <select className={selectCls} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.customer_name}</option>
              ))}
            </select>
          </Field>
          <Field label="Order">
            <select className={selectCls} value={orderId} onChange={(e) => {
              setOrderId(e.target.value);
              const o = orders.find((x) => x.id === e.target.value);
              if (o) setAmount(Number(o.total) ? String(Number(o.total)) : "");
            }}>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>{o.order_number}</option>
              ))}
            </select>
          </Field>
          <Field label="Amount (USD)">
            <NumberField value={amount} onChange={setAmount} placeholder="0" />
          </Field>
          <Field label="Date">
            <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Payment Mode" className="col-span-2">
            <select className={selectCls} value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}>
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </Field>
          <Field label="Payment Ref" className="col-span-2">
            <input className={inputCls} value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="UPI-2026-XXXX-XXX" />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="default"
            size="sm"
            disabled={!customerId || !orderId || !paymentRef.trim()}
            onClick={() => {
              onSave({ customer_id: customerId, order_id: orderId, amount: Number(amount) || 0, payment_mode: paymentMode, payment_ref: paymentRef.trim(), date });
              onOpenChange(false);
            }}
          >
            {initial ? "Save Changes" : "Add Transaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
