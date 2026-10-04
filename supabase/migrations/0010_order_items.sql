-- 0010: order line items (order contents).
-- Run this in the Supabase SQL Editor.
create table if not exists order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders (id) on delete cascade,
  position    integer not null default 0,
  name        text not null default '',
  detail      text not null default '',
  qty         numeric not null default 1,
  price       numeric not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists order_items_order_id_idx on order_items (order_id);

alter table order_items enable row level security;
drop policy if exists "dev_full_access" on order_items;
create policy "dev_full_access" on order_items
  for all using (true) with check (true);
