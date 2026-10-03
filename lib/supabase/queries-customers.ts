import { supabase } from "./client";
import {
  CustomerWithMeasurement,
  MeasurementRow,
} from "./database.types";

export interface MeasurementInput {
  label: string;
  blouse_length: number;
  shoulder: number;
  chest: number;
  waist: number;
  armhole: number;
  sleeve_length: number;
  sleeve_round: number;
  front_neck_deep: number;
  back_neck_deep: number;
}

export interface CustomerInput {
  customer_name: string;
  email: string;
  phone: string;
  avatar_url: string;
  special_notes: string;
  measurement: MeasurementInput;
}

function throwIf(error: unknown, action: string): void {
  if (error) throw new Error(`${action}: ${(error as Error).message}`);
}

const CUSTOMER_SELECT =
  "*, measurements (*)";

export async function listCustomers(): Promise<CustomerWithMeasurement[]> {
  const { data, error } = await supabase
    .from("customers")
    .select(CUSTOMER_SELECT)
    .order("customer_name");
  throwIf(error, "Failed to load customers");
  return (data ?? []) as CustomerWithMeasurement[];
}

export async function getCustomer(
  id: string
): Promise<CustomerWithMeasurement | null> {
  const { data, error } = await supabase
    .from("customers")
    .select(CUSTOMER_SELECT)
    .eq("id", id)
    .single();
  if (error && (error as { code?: string }).code !== "PGRST116") {
    throw new Error(`Failed to load customer: ${(error as Error).message}`);
  }
  return (data ?? null) as CustomerWithMeasurement | null;
}

export async function createMeasurement(
  input: MeasurementInput
): Promise<MeasurementRow> {
  const { data, error } = await supabase
    .from("measurements")
    .insert(input)
    .select()
    .single();
  throwIf(error, "Failed to create measurements");
  return data as MeasurementRow;
}

export async function updateMeasurement(
  id: string,
  input: MeasurementInput
): Promise<void> {
  const { error } = await supabase
    .from("measurements")
    .update(input)
    .eq("id", id);
  throwIf(error, "Failed to update measurements");
}

export async function createCustomer(
  input: CustomerInput
): Promise<CustomerWithMeasurement> {
  const measurement = await createMeasurement(input.measurement);
  const { data, error } = await supabase
    .from("customers")
    .insert({
      customer_name: input.customer_name,
      email: input.email,
      phone: input.phone,
      avatar_url: input.avatar_url,
      special_notes: input.special_notes,
      measurement_id: measurement.id,
    })
    .select(CUSTOMER_SELECT)
    .single();
  throwIf(error, "Failed to create customer");
  return data as CustomerWithMeasurement;
}

export async function updateCustomer(
  id: string,
  input: Omit<CustomerInput, "measurement"> & { measurement_id: string | null },
  measurement: MeasurementInput
): Promise<CustomerWithMeasurement> {
  let measurementId = input.measurement_id;
  if (measurementId) {
    await updateMeasurement(measurementId, measurement);
  } else {
    const created = await createMeasurement(measurement);
    measurementId = created.id;
  }
  const { data, error } = await supabase
    .from("customers")
    .update({
      customer_name: input.customer_name,
      email: input.email,
      phone: input.phone,
      avatar_url: input.avatar_url,
      special_notes: input.special_notes,
      measurement_id: measurementId,
    })
    .eq("id", id)
    .select(CUSTOMER_SELECT)
    .single();
  throwIf(error, "Failed to update customer");
  return data as CustomerWithMeasurement;
}
