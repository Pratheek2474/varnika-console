-- ============================================================================
-- 0002 — Move priority from customers to orders.
-- Run this in the Supabase SQL Editor on any database seeded with 0001.
-- (Fresh databases can just run 0001, which already reflects this change.)
-- Existing orders get 'medium'; per-order priority is edited in the app.
-- ============================================================================

create type priority_level as enum ('low', 'medium', 'high');

alter table orders
  add column priority priority_level not null default 'medium';

alter table customers
  drop column priority;

drop type customer_priority;
