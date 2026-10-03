import { supabase } from "./client";
import { EmployeeRow } from "./database.types";

function throwIf(error: unknown, action: string): void {
  if (error) throw new Error(`${action}: ${(error as Error).message}`);
}

export async function listEmployees(): Promise<EmployeeRow[]> {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("name");
  throwIf(error, "Failed to load employees");
  return (data ?? []) as EmployeeRow[];
}

export interface EmployeeInput {
  name: string;
  phone: string;
  role: string;
  avatar_url: string;
  is_active: boolean;
}

export async function createEmployee(
  input: EmployeeInput
): Promise<EmployeeRow> {
  const { data, error } = await supabase
    .from("employees")
    .insert(input)
    .select()
    .single();
  throwIf(error, "Failed to add employee");
  return data as EmployeeRow;
}

export async function updateEmployee(
  id: string,
  input: EmployeeInput
): Promise<EmployeeRow> {
  const { data, error } = await supabase
    .from("employees")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  throwIf(error, "Failed to update employee");
  return data as EmployeeRow;
}

export async function setEmployeeActive(
  id: string,
  isActive: boolean
): Promise<void> {
  const { error } = await supabase
    .from("employees")
    .update({ is_active: isActive })
    .eq("id", id);
  throwIf(error, "Failed to update employee status");
}
