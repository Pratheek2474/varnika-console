"use client";

import React, { useEffect, useState } from "react";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { useAuth } from "@/lib/context/auth-context";
import { useActor } from "@/lib/context/actor-context";
import { EmployeeRow } from "@/lib/supabase/database.types";
import {
  createEmployee,
  listEmployees,
  setEmployeeActive,
  updateEmployee,
  EmployeeInput,
} from "@/lib/supabase/queries-employees";
import { logActivity } from "@/lib/supabase/activity";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableListSkeleton } from "@/components/ui/page-skeletons";
import { Search, Plus, Pencil, UserCheck, UserX } from "lucide-react";
import { EmployeeFormDialog } from "@/components/forms/EmployeeFormDialog";

export default function EmployeesPage() {
  const { permissions } = useAuth();
  const { actor, refreshEmployees } = useActor();
  const [searchQuery, setSearchQuery] = useState("");
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeRow | null>(null);

  const canWrite = permissions.includes("employees.write");

  const refresh = async () => {
    try {
      setLoadError(null);
      setEmployees(await listEmployees());
      await refreshEmployees();
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const visible = employees.filter(
    (e) =>
      (showInactive || e.is_active) &&
      (e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSave = async (values: EmployeeInput) => {
    if (editing) {
      const updated = await updateEmployee(editing.id, values);
      setEmployees((prev) => prev.map((e) => (e.id === editing.id ? updated : e)));
      await logActivity({
        actor,
        action: "edited",
        entityType: "employee",
        entityId: editing.id,
        entityLabel: values.name,
      });
      setEditing(null);
    } else {
      const created = await createEmployee(values);
      setEmployees((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      );
      await logActivity({
        actor,
        action: "added",
        entityType: "employee",
        entityId: created.id,
        entityLabel: created.name,
      });
    }
    await refreshEmployees();
  };

  const toggleActive = async (emp: EmployeeRow) => {
    await setEmployeeActive(emp.id, !emp.is_active);
    setEmployees((prev) =>
      prev.map((e) => (e.id === emp.id ? { ...e, is_active: !emp.is_active } : e))
    );
    await logActivity({
      actor,
      action: "edited",
      entityType: "employee",
      entityId: emp.id,
      entityLabel: emp.name,
      detail: emp.is_active ? "deactivated" : "reactivated",
    });
    await refreshEmployees();
  };

  if (loading) return <TableListSkeleton rows={5} cols={4} />;

  return (
    <RouteGuard requiredPermission="employees.read" moduleName="Employees">
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#E6E3DB]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">
              Employees
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Atelier staff directory — changes are recorded under the acting name.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <label className="flex items-center gap-1.5 text-[11px] text-neutral-500">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="accent-black"
              />
              Show inactive
            </label>
            {canWrite && (
              <Button variant="default" size="sm" className="h-8 text-xs" onClick={() => { setEditing(null); setFormOpen(true); }}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Employee
              </Button>
            )}
          </div>
        </div>

        {loadError && (
          <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xs">
            {loadError}{" "}
            <button onClick={refresh} className="underline font-medium">Retry</button>
          </div>
        )}

        {/* Search */}
        <div className="flex items-center bg-white p-3 border border-[#E6E3DB] rounded-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#FAF9F6] border border-[#E6E3DB] text-xs focus:outline-none focus:border-black rounded-xs"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white border border-[#E6E3DB] rounded-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F6] text-neutral-400 font-medium text-[11px] border-b border-[#E6E3DB]">
              <tr>
                <th className="py-3.5 px-6">Name</th>
                <th className="py-3.5 px-6">Role</th>
                <th className="py-3.5 px-6">Phone</th>
                <th className="py-3.5 px-6">Status</th>
                {canWrite && <th className="py-3.5 px-6 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE1]">
              {visible.map((emp) => (
                <tr key={emp.id} className="hover:bg-[#FAF9F6] transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-black text-white text-xs font-medium flex items-center justify-center shrink-0">
                        {emp.name.charAt(0)}
                      </div>
                      <span className="font-medium text-black">{emp.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-neutral-700">{emp.role}</td>
                  <td className="py-4 px-6 font-mono text-neutral-500">{emp.phone || "—"}</td>
                  <td className="py-4 px-6">
                    <Badge variant={emp.is_active ? "secondary" : "outline"} className="text-[10px]">
                      {emp.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  {canWrite && (
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => { setEditing(emp); setFormOpen(true); }}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-xs border border-[#E6E3DB] hover:border-black hover:bg-[#F4F2ED] transition-colors"
                          title="Edit employee"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleActive(emp)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-xs border border-[#E6E3DB] hover:border-black hover:bg-[#F4F2ED] transition-colors"
                          title={emp.is_active ? "Deactivate" : "Reactivate"}
                        >
                          {emp.is_active ? (
                            <UserX className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && !loadError && (
            <div className="text-center py-12 text-xs text-neutral-400">
              No employees found.
            </div>
          )}
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden space-y-3">
          {visible.map((emp) => (
            <div key={emp.id} className="p-4 bg-white border border-[#E6E3DB] rounded-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-black">{emp.name}</span>
                <Badge variant={emp.is_active ? "secondary" : "outline"} className="text-[10px]">
                  {emp.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="text-xs text-neutral-500">
                {emp.role}{emp.phone ? ` · ${emp.phone}` : ""}
              </div>
              {canWrite && (
                <div className="flex gap-2 pt-2 border-t border-[#F0ECE1]">
                  <Button variant="outline" size="sm" className="flex-1 h-7 text-[11px]" onClick={() => { setEditing(emp); setFormOpen(true); }}>
                    <Pencil className="w-3 h-3 mr-1.5" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 h-7 text-[11px]" onClick={() => toggleActive(emp)}>
                    {emp.is_active ? "Deactivate" : "Reactivate"}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        <EmployeeFormDialog open={formOpen} onOpenChange={setFormOpen} initial={editing} onSave={handleSave} />
      </div>
    </RouteGuard>
  );
}
