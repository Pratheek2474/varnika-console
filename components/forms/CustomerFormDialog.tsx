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
import { CustomerWithMeasurement } from "@/lib/supabase/database.types";
import {
  CustomerInput,
  MeasurementInput,
} from "@/lib/supabase/queries-customers";
import { Field, NumberField, inputCls, selectCls } from "./fields";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: CustomerWithMeasurement | null;
  onSave: (values: CustomerInput) => void;
}

const EMPTY_MEASUREMENT: MeasurementInput = {
  label: "",
  blouse_length: 0,
  shoulder: 0,
  chest: 0,
  waist: 0,
  armhole: 0,
  sleeve_length: 0,
  sleeve_round: 0,
  front_neck_deep: 0,
  back_neck_deep: 0,
};

const MEASUREMENT_FIELDS: { key: keyof Omit<MeasurementInput, "label">; label: string }[] = [
  { key: "blouse_length", label: "Blouse Length" },
  { key: "shoulder", label: "Shoulder" },
  { key: "chest", label: "Chest" },
  { key: "waist", label: "Waist" },
  { key: "armhole", label: "Armhole" },
  { key: "sleeve_length", label: "Sleeve Length" },
  { key: "sleeve_round", label: "Sleeve Round" },
  { key: "front_neck_deep", label: "Front Neck Deep" },
  { key: "back_neck_deep", label: "Back Neck Deep" },
];

export function CustomerFormDialog({ open, onOpenChange, initial, onSave }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [measurement, setMeasurement] = useState<MeasurementInput>(EMPTY_MEASUREMENT);

  useEffect(() => {
    if (open) {
      if (initial) {
        setName(initial.customer_name);
        setEmail(initial.email);
        setPhone(initial.phone);
        setAvatarUrl(initial.avatar_url);
        setSpecialNotes(initial.special_notes);
        setMeasurement(
          initial.measurements
            ? {
                label: initial.measurements.label,
                blouse_length: Number(initial.measurements.blouse_length),
                shoulder: Number(initial.measurements.shoulder),
                chest: Number(initial.measurements.chest),
                waist: Number(initial.measurements.waist),
                armhole: Number(initial.measurements.armhole),
                sleeve_length: Number(initial.measurements.sleeve_length),
                sleeve_round: Number(initial.measurements.sleeve_round),
                front_neck_deep: Number(initial.measurements.front_neck_deep),
                back_neck_deep: Number(initial.measurements.back_neck_deep),
              }
            : { ...EMPTY_MEASUREMENT, label: `${initial.customer_name} — Blouse` }
        );
      } else {
        setName("");
        setEmail("");
        setPhone("");
        setAvatarUrl("");
        setSpecialNotes("");
        setMeasurement(EMPTY_MEASUREMENT);
      }
    }
  }, [open, initial]);

  const setM = (k: keyof MeasurementInput, v: string | number) =>
    setMeasurement((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Customer" : "Add Customer"}</DialogTitle>
          <DialogDescription>
            {initial
              ? "Update client profile and blouse measurements."
              : "Create a new client profile with blouse measurements."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2 text-xs">
          <Field label="Full Name">
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Aarav Mehta" />
          </Field>
          <Field label="Email">
            <input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" />
          </Field>
          <Field label="Phone">
            <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 ..." />
          </Field>
          <Field label="Avatar URL" className="col-span-2">
            <input className={inputCls} value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
          </Field>

          <div className="col-span-2 pt-2 text-[11px] font-medium text-neutral-500 uppercase tracking-wide">
            Blouse Measurements (inches)
          </div>
          <Field label="Label" className="col-span-2">
            <input className={inputCls} value={measurement.label} onChange={(e) => setM("label", e.target.value)} placeholder="Name — Blouse" />
          </Field>
          {MEASUREMENT_FIELDS.map((f) => (
            <Field key={f.key} label={`${f.label} (in)`}>
              <NumberField
                value={measurement[f.key] === 0 ? "" : String(measurement[f.key])}
                onChange={(v) => setM(f.key, Number(v) || 0)}
                placeholder="—"
              />
            </Field>
          ))}
          <Field label="Special Notes" className="col-span-2">
            <textarea rows={2} className={inputCls} value={specialNotes} onChange={(e) => setSpecialNotes(e.target.value)} />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="default"
            size="sm"
            disabled={!name.trim() || !email.trim()}
            onClick={() => {
              onSave({
                customer_name: name.trim(),
                email: email.trim(),
                phone,
                avatar_url: avatarUrl,
                special_notes: specialNotes,
                measurement: {
                  ...measurement,
                  label: measurement.label.trim() || `${name.trim()} — Blouse`,
                },
              });
              onOpenChange(false);
            }}
          >
            {initial ? "Save Changes" : "Add Customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
