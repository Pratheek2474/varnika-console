-- 0014 — Customer app ("Varnika" store). Run in the Supabase SQL Editor.
--
-- Adds what the customer app needs on top of the console schema:
--   * products: MRP (for "% off"), description, occasions
--   * customers: link to a Supabase Auth user (phone sign-in)
--   * measurements: several sets per customer
--   * orders: kind (ready / stitch / custom request), delivery address
--   * customer_addresses, store_visits
--
-- NOTE: row level security is still the permissive development setup used by the
-- console (policy "dev_full_access"). Before launch, replace it with real policies
-- (customers see only their own rows, staff see everything). The customer app already
-- filters every query by the signed-in customer, but the database does not enforce it yet.

alter table products
  add column if not exists mrp         numeric(12, 2) not null default 0,
  add column if not exists description text           not null default '',
  add column if not exists occasions   text[]         not null default '{}';

alter table customers
  add column if not exists auth_user_id uuid unique;

alter table measurements
  add column if not exists customer_id uuid references customers (id) on delete cascade;
create index if not exists measurements_customer_id_idx on measurements (customer_id);

alter table orders
  add column if not exists kind    text not null default 'ready'
    check (kind in ('ready', 'stitch', 'custom')),
  add column if not exists source  text not null default 'console',
  add column if not exists ship_to text not null default '';

create table if not exists customer_addresses (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  label       text not null default 'Home',
  full_name   text not null default '',
  phone       text not null default '',
  line        text not null default '',
  city        text not null default '',
  pincode     text not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists customer_addresses_customer_idx on customer_addresses (customer_id);

create table if not exists store_visits (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete cascade,
  visit_on    date not null,
  slot        text not null default '',
  status      text not null default 'booked',
  created_at  timestamptz not null default now()
);
create index if not exists store_visits_customer_idx on store_visits (customer_id);

alter table customer_addresses enable row level security;
alter table store_visits       enable row level security;

drop policy if exists "dev_full_access" on customer_addresses;
create policy "dev_full_access" on customer_addresses for all using (true) with check (true);
drop policy if exists "dev_full_access" on store_visits;
create policy "dev_full_access" on store_visits for all using (true) with check (true);
