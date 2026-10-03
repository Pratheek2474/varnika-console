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
import { EmployeeRow } from "@/lib/supabase/database.types";
import { EmployeeInput } from "@/lib/supabase/queries-employees";
import { Field, inputCls, selectCls } from "./fields";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: EmployeeRow | null;
  onSave: (values: EmployeeInput) => void;
}

export function EmployeeFormDialog({ open, onOpenChange, initial, onSave }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Staff");
  const [customRole, setCustomRole] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [appRole, setAppRole] = useState<"admin" | "staff">("staff");

  useEffect(() => {
    if (open) {
      if (initial) {
        setName(initial.name);
        setPhone(initial.phone);
        setRole(initial.role);
        setCustomRole("");
        setAvatarUrl(initial.avatar_url);
        setIsActive(initial.is_active);
        setAppRole((initial.app_role as "admin" | "staff") || "staff");
      } else {
        setName("");
        setPhone("");
        setRole("Staff");
        setCustomRole("");
        setAvatarUrl("");
        setIsActive(true);
        setAppRole("staff");
      }
    }
  }, [open, initial]);

  const finalRole = role === "__custom" ? customRole.trim() : role;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Employee" : "Add Employee"}</DialogTitle>
          <DialogDescription>
            {initial ? "Update staff details." : "Add someone to the atelier team."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2 text-xs">
          <Field label="Full Name">
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Anand Kumar" />
          </Field>
          <Field label="Role">
            <select className={selectCls} value={role} onChange={(e) => setRole(e.target.value)}>
              <option>Staff</option>
              <option>Master Tailor</option>
              <option>Administrator</option>
              <option>Floor Manager</option>
              <option>Concierge</option>
              <option value="__custom">+ Custom…</option>
            </select>
          </Field>
          {role === "__custom" && (
            <Field label="Custom Role" className="col-span-2">
              <input className={inputCls} value={customRole} onChange={(e) => setCustomRole(e.target.value)} />
            </Field>
          )}
          <Field label="Phone">
            <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 ..." />
          </Field>
          <Field label="Avatar URL">
            <input className={inputCls} value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
          </Field>
          <label className="col-span-2 flex items-center gap-2 text-xs text-neutral-700">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="accent-black" />
            Active (inactive staff are hidden from lists)
          </label>
          <Field label="Console Access" className="col-span-2">
            <select className={selectCls} value={appRole} onChange={(e) => setAppRole(e.target.value as "admin" | "staff")}>
              <option value="staff">Staff — day-to-day operations</option>
              <option value="admin">Admin — everything + money + settings</option>
            </select>
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="default"
            size="sm"
            disabled={!name.trim() || !finalRole}
            onClick={() => {
              onSave({
                name: name.trim(),
                phone,
                role: finalRole,
                avatar_url: avatarUrl,
                is_active: isActive,
                app_role: appRole,
              });
              onOpenChange(false);
            }}
          >
            {initial ? "Save Changes" : "Add Employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
