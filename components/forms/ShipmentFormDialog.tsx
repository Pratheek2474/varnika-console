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
import { ShipmentRow, ShipmentStatus } from "@/lib/supabase/database.types";
import { ShipmentInput } from "@/lib/supabase/queries-ops";
import { Field, inputCls, selectCls } from "./fields";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: ShipmentRow | null;
  orders: { id: string; order_number: string; customer_name: string }[];
  onSave: (
    values: ShipmentInput,
    milestone?: { status_text: string; location: string }
  ) => void;
}

const STATUSES: { value: ShipmentStatus; label: string }[] = [
  { value: "shipped", label: "Shipped" },
  { value: "in_transit", label: "In Transit" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
];

export function ShipmentFormDialog({ open, onOpenChange, initial, orders, onSave }: Props) {
  const [orderId, setOrderId] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<ShipmentStatus>("shipped");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [milestoneStatus, setMilestoneStatus] = useState("");
  const [milestoneLocation, setMilestoneLocation] = useState("");

  useEffect(() => {
    if (open) {
      if (initial) {
        setOrderId(initial.order_id ?? orders[0]?.id ?? "");
        setTrackingNumber(initial.tracking_number);
        setCarrier(initial.carrier);
        setDestinationCity(initial.destination_city);
        setAddress((initial as { address?: string }).address ?? "");
        setStatus(initial.status);
        setEstimatedDelivery(initial.estimated_delivery);
        setMilestoneStatus("");
        setMilestoneLocation("");
      } else {
        setOrderId(orders[0]?.id ?? "");
        setTrackingNumber("");
        setCarrier("");
        setDestinationCity("");
        setAddress("");
        setStatus("shipped");
        setEstimatedDelivery("");
        setMilestoneStatus("");
        setMilestoneLocation("");
      }
    }
  }, [open, initial, orders]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Delivery" : "Add Delivery"}</DialogTitle>
          <DialogDescription>
            {initial ? "Update tracking, status, or append a milestone." : "Create a new shipment linked to an order."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2 text-xs">
          <Field label="Order" className="col-span-2">
            <select className={selectCls} value={orderId} onChange={(e) => setOrderId(e.target.value)}>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>{o.order_number} — {o.customer_name}</option>
              ))}
            </select>
          </Field>
          <Field label="Tracking Number" className="col-span-2">
            <input className={inputCls} value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="DHL-EXP-..." />
          </Field>
          <Field label="Carrier">
            <input className={inputCls} value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="DHL Express" />
          </Field>
          <Field label="Status">
            <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value as ShipmentStatus)}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Destination City">
            <input className={inputCls} value={destinationCity} onChange={(e) => setDestinationCity(e.target.value)} placeholder="Mumbai, India" />
          </Field>
          <Field label="Estimated Delivery">
            <input type="date" className={inputCls} value={estimatedDelivery} onChange={(e) => setEstimatedDelivery(e.target.value)} />
          </Field>
          <Field label="Full Address" className="col-span-2">
            <textarea
              rows={2}
              className={inputCls}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Flat, street, area, city, state, PIN"
            />
          </Field>
          <div className="col-span-2 pt-2 text-[11px] font-medium text-neutral-500 uppercase tracking-wide">New Milestone (optional)</div>
          <Field label="Milestone Status">
            <input className={inputCls} value={milestoneStatus} onChange={(e) => setMilestoneStatus(e.target.value)} placeholder="Arrived at hub" />
          </Field>
          <Field label="Milestone Location">
            <input className={inputCls} value={milestoneLocation} onChange={(e) => setMilestoneLocation(e.target.value)} placeholder="Delhi Hub" />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="default"
            size="sm"
            disabled={!orderId || !trackingNumber.trim()}
            onClick={() => {
              onSave(
                {
                  order_id: orderId,
                  tracking_number: trackingNumber.trim(),
                  carrier: carrier.trim(),
                  destination_city: destinationCity,
                  address: address.trim(),
                  status,
                  estimated_delivery: estimatedDelivery,
                },
                { status_text: milestoneStatus, location: milestoneLocation }
              );
              onOpenChange(false);
            }}
          >
            {initial ? "Save Changes" : "Add Delivery"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
