-- ============================================================================
-- Varnika Atelier Console — Initial Schema (0001)
-- Run this in the Supabase SQL Editor (or via `supabase db push`).
-- Covers: customers, measurements, products, orders (+ timeline/photos/
--         documents), transactions, shipments (+ milestones), tickets,
--         storage buckets.
-- App enforces RBAC itself (see AGENT.md), so RLS policies below are
-- permissive for development. Tighten them before production.
-- ============================================================================

-- Extensions -----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Enums ----------------------------------------------------------------------
-- NOTE: order/shipment statuses use lowercase values; display labels
-- (e.g. 'Out for delivery') are formatted in the app.

create type priority_level as enum ('low', 'medium', 'high');

create type order_status as enum (
  'new', 'active', 'hold', 'dispatched', 'delivered'
);

create type payment_mode as enum (
  'credit_card', 'debit_card', 'upi', 'bank_transfer', 'cash'
);

create type shipment_status as enum (
  'shipped', 'in_transit', 'out_for_delivery', 'delivered'
);

create type ticket_status as enum ('open', 'in_progress', 'resolved');

create type document_kind as enum (
  'invoice', 'measurement_chart', 'design_sketch',
  'receipt', 'shipping_label', 'other'
);

create type timeline_state as enum ('completed', 'current', 'upcoming');

-- Tables ---------------------------------------------------------------------

-- A measurement record is one set of blouse measurements (inches).
-- Linked from customers (their body measurements) and products
-- (the base/sample measurements for that product).
create table measurements (
  id              uuid primary key default gen_random_uuid(),
  label           text not null default '',       -- e.g. 'Priya Sharma — Blouse'
  blouse_length   numeric(5, 2) not null default 0,
  shoulder        numeric(5, 2) not null default 0,
  chest           numeric(5, 2) not null default 0,
  waist           numeric(5, 2) not null default 0,
  armhole         numeric(5, 2) not null default 0,
  sleeve_length   numeric(5, 2) not null default 0,
  sleeve_round    numeric(5, 2) not null default 0,
  front_neck_deep numeric(5, 2) not null default 0,
  back_neck_deep  numeric(5, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table customers (
  id            uuid primary key default gen_random_uuid(),
  customer_name text not null,
  email         text not null unique,
  phone         text not null default '',
  avatar_url    text not null default '',
  measurement_id uuid references measurements (id) on delete set null,
  special_notes text not null default '',

  -- Cached aggregates, maintained by trigger on orders (see below)
  total_spent   numeric(12, 2) not null default 0,
  orders_count  integer not null default 0,
  last_order_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index customers_measurement_id_idx on customers (measurement_id);

create table products (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  sku            text not null unique,
  category       text not null default '',
  price          numeric(12, 2) not null default 0,
  stock          integer not null default 0,
  image_url      text not null default '',
  material       text not null default '',
  featured       boolean not null default false,
  measurement_id uuid references measurements (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_measurement_id_idx on products (measurement_id);

create table orders (
  id            uuid primary key default gen_random_uuid(),
  order_number  text not null unique,              -- e.g. 'VAR-8842'
  customer_id   uuid references customers (id) on delete set null,
  item_summary  text not null default '',
  total         numeric(12, 2) not null default 0,
  currency      text not null default 'USD',
  status        order_status not null default 'new',
  priority      priority_level not null default 'medium',
  delivery_date date,
  notes         text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index orders_customer_id_idx on orders (customer_id);
create index orders_status_idx on orders (status);

create table order_timeline_events (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders (id) on delete cascade,
  position     integer not null default 0,
  title        text not null,
  description  text,
  display_time text,                               -- 'Sep 24, 2026 · 10:15 AM' / 'Scheduled' / 'Target: …'
  state        timeline_state not null default 'upcoming',
  created_at   timestamptz not null default now()
);
create index order_timeline_events_order_id_idx
  on order_timeline_events (order_id, position);

create table order_photos (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders (id) on delete cascade,
  url         text not null,
  caption     text not null default '',
  uploaded_at timestamptz not null default now()
);
create index order_photos_order_id_idx on order_photos (order_id);

create table order_documents (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders (id) on delete cascade,
  name        text not null,
  kind        document_kind not null,
  size_text   text not null default '',            -- display text, e.g. '245 KB'
  url         text not null default '',
  uploaded_at timestamptz not null default now()
);
create index order_documents_order_id_idx on order_documents (order_id);

-- Transactions are tracked manually: no status column, just the record.
create table transactions (
  id            uuid primary key default gen_random_uuid(),
  serial_number integer generated by default as identity unique,
  customer_id   uuid references customers (id) on delete set null,
  order_id      uuid references orders (id) on delete set null,
  amount        numeric(12, 2) not null,
  currency      text not null default 'USD',
  payment_mode  payment_mode not null,
  payment_ref   text not null unique,
  occurred_at   timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index transactions_customer_id_idx on transactions (customer_id);
create index transactions_order_id_idx on transactions (order_id);

create table shipments (
  id                 uuid primary key default gen_random_uuid(),
  tracking_number    text not null unique,
  carrier            text not null default '',    -- free text
  destination_city   text not null default '',
  recipient_name     text not null default '',
  order_id           uuid references orders (id) on delete set null,
  status             shipment_status not null default 'shipped',
  estimated_delivery text not null default '',     -- display text, e.g. 'Today by 4:00 PM'
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index shipments_order_id_idx on shipments (order_id);
create index shipments_status_idx on shipments (status);

create table shipment_milestones (
  id          uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references shipments (id) on delete cascade,
  position    integer not null default 0,
  status_text text not null,
  location    text not null default '',
  time_text   text not null default '',            -- display text, e.g. 'Sep 26 14:00'
  created_at  timestamptz not null default now()
);
create index shipment_milestones_shipment_id_idx
  on shipment_milestones (shipment_id, position);

create table tickets (
  id            uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,              -- e.g. 'TCK-902'
  customer_id   uuid references customers (id) on delete set null,
  order_id      uuid references orders (id) on delete set null,
  subject       text not null default '',
  status        ticket_status not null default 'open',
  assigned_to   text not null default '',
  last_message  text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index tickets_customer_id_idx on tickets (customer_id);
create index tickets_order_id_idx on tickets (order_id);
create index tickets_status_idx on tickets (status);

-- Triggers -------------------------------------------------------------------

-- Generic updated_at bump
create or replace function set_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

create trigger customers_set_updated_at
  before update on customers
  for each row execute function set_updated_at();

create trigger measurements_set_updated_at
  before update on measurements
  for each row execute function set_updated_at();

create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

create trigger transactions_set_updated_at
  before update on transactions
  for each row execute function set_updated_at();

create trigger shipments_set_updated_at
  before update on shipments
  for each row execute function set_updated_at();

create trigger tickets_set_updated_at
  before update on tickets
  for each row execute function set_updated_at();

-- Keep customers.total_spent / orders_count / last_order_at in sync with orders
create or replace function sync_one_customer(p_customer_id uuid)
returns void as $$
begin
  if p_customer_id is null then
    return;
  end if;
  update customers c
  set total_spent   = coalesce(
                        (select sum(o.total)
                         from orders o
                         where o.customer_id = p_customer_id), 0),
      orders_count  = (select count(*)
                       from orders o
                       where o.customer_id = p_customer_id),
      last_order_at = (select max(o.created_at)
                       from orders o
                       where o.customer_id = p_customer_id),
      updated_at    = now()
  where c.id = p_customer_id;
end;
$$ language plpgsql;

create or replace function sync_customer_order_stats()
returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    perform sync_one_customer(OLD.customer_id);
    return OLD;
  else
    perform sync_one_customer(NEW.customer_id);
    if TG_OP = 'UPDATE'
       and OLD.customer_id is distinct from NEW.customer_id then
      perform sync_one_customer(OLD.customer_id);
    end if;
    return NEW;
  end if;
end;
$$ language plpgsql;

create trigger orders_sync_customer_stats
  after insert or update or delete on orders
  for each row execute function sync_customer_order_stats();

-- Row Level Security (permissive for development) -----------------------------
-- The console enforces its own RBAC in the app layer (see AGENT.md).
-- Tighten these policies before production.

alter table customers             enable row level security;
alter table measurements          enable row level security;
alter table products              enable row level security;
alter table orders                enable row level security;
alter table order_timeline_events enable row level security;
alter table order_photos          enable row level security;
alter table order_documents       enable row level security;
alter table transactions          enable row level security;
alter table shipments             enable row level security;
alter table shipment_milestones   enable row level security;
alter table tickets               enable row level security;

create policy "dev_full_access" on customers
  for all using (true) with check (true);
create policy "dev_full_access" on measurements
  for all using (true) with check (true);
create policy "dev_full_access" on products
  for all using (true) with check (true);
create policy "dev_full_access" on orders
  for all using (true) with check (true);
create policy "dev_full_access" on order_timeline_events
  for all using (true) with check (true);
create policy "dev_full_access" on order_photos
  for all using (true) with check (true);
create policy "dev_full_access" on order_documents
  for all using (true) with check (true);
create policy "dev_full_access" on transactions
  for all using (true) with check (true);
create policy "dev_full_access" on shipments
  for all using (true) with check (true);
create policy "dev_full_access" on shipment_milestones
  for all using (true) with check (true);
create policy "dev_full_access" on tickets
  for all using (true) with check (true);

-- Storage (order photos, documents, avatars) ----------------------------------

insert into storage.buckets (id, name, public)
values
  ('avatars',         'avatars',         true),
  ('order-photos',    'order-photos',    true),
  ('order-documents', 'order-documents', false)
on conflict (id) do nothing;

-- Public read for avatars + photos; authenticated users can manage files.
-- Order documents stay private (authenticated read).

create policy "public read avatars"
  on storage.objects for select using (bucket_id = 'avatars');
create policy "auth manage avatars"
  on storage.objects for all using (bucket_id = 'avatars')
  with check (bucket_id = 'avatars');

create policy "public read order photos"
  on storage.objects for select using (bucket_id = 'order-photos');
create policy "auth manage order photos"
  on storage.objects for all using (bucket_id = 'order-photos')
  with check (bucket_id = 'order-photos');

create policy "auth read order documents"
  on storage.objects for select using (bucket_id = 'order-documents');
create policy "auth manage order documents"
  on storage.objects for all using (bucket_id = 'order-documents')
  with check (bucket_id = 'order-documents');
