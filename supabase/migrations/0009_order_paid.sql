-- 0009: manual paid flag on orders.
-- Paid = this flag OR linked transactions covering the order total.
-- Run this in the Supabase SQL editor (the app treats the flag as unpaid
-- until this is applied, and the Mark-paid button will say so).
alter table orders
  add column if not exists is_paid boolean not null default false;
