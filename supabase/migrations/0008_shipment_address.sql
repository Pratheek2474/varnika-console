-- 0008: full delivery address on shipments.
-- Run this in the Supabase SQL editor (the app also tolerates the column
-- being absent — it retries writes without it until this is applied).
alter table shipments
  add column if not exists address text not null default '';
