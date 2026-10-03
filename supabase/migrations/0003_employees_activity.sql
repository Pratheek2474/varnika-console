-- ============================================================================
-- 0003 — Employees directory + activity log (audit trail).
-- Run this in the Supabase SQL Editor.
-- Backfills employees (Admin + ticket assignees) and history entries
-- for existing rows so the Updates feed has content immediately.
-- ============================================================================

create table employees (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text not null default '',
  role       text not null default 'Staff',
  is_active  boolean not null default true,
  avatar_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Immutable audit trail. customer/order columns are snapshots (no FKs)
-- so entries survive entity deletion.
create table activity_log (
  id            uuid primary key default gen_random_uuid(),
  actor_name    text not null default '',
  action        text not null default '',   -- added/edited/status_changed/resolved/raised/milestone
  entity_type   text not null default '',   -- customer/order/transaction/shipment/ticket/product/employee
  entity_id     uuid,
  entity_label  text not null default '',
  detail        text not null default '',
  customer_id   uuid,
  customer_name text not null default '',
  order_id      uuid,
  order_number  text not null default '',
  created_at    timestamptz not null default now()
);
create index activity_log_created_idx on activity_log (created_at desc);
create index activity_log_entity_idx on activity_log (entity_type);

-- Triggers -------------------------------------------------------------------

create trigger employees_set_updated_at
  before update on employees
  for each row execute function set_updated_at();

-- Row Level Security (permissive for development, app enforces RBAC) ----------

alter table employees    enable row level security;
alter table activity_log enable row level security;

create policy "dev_full_access" on employees
  for all using (true) with check (true);
create policy "dev_full_access" on activity_log
  for all using (true) with check (true);

-- Backfill -------------------------------------------------------------------

insert into employees (name, role)
values ('Admin', 'Administrator');

insert into employees (name, role)
select distinct assigned_to, 'Staff'
from tickets
where assigned_to is not null
  and assigned_to <> ''
  and assigned_to <> 'Unassigned'
  and assigned_to not in (select name from employees);

insert into activity_log
  (actor_name, action, entity_type, entity_id, entity_label,
   customer_id, customer_name, created_at)
select 'System', 'added', 'customer', id, customer_name,
  id, customer_name, created_at
from customers;

insert into activity_log
  (actor_name, action, entity_type, entity_id, entity_label,
   customer_id, customer_name, order_id, order_number, created_at)
select 'System', 'added', 'order', o.id, o.order_number,
  o.customer_id, coalesce(c.customer_name, ''), o.id, o.order_number, o.created_at
from orders o
left join customers c on c.id = o.customer_id;

insert into activity_log
  (actor_name, action, entity_type, entity_id, entity_label, detail,
   customer_id, customer_name, order_id, order_number, created_at)
select 'System', 'added', 'transaction', t.id, t.payment_ref,
  t.currency || ' ' || t.amount || ' via ' || replace(t.payment_mode::text, '_', ' '),
  t.customer_id, coalesce(c.customer_name, ''), t.order_id, coalesce(o.order_number, ''), t.occurred_at
from transactions t
left join customers c on c.id = t.customer_id
left join orders o on o.id = t.order_id;

insert into activity_log
  (actor_name, action, entity_type, entity_id, entity_label,
   customer_id, customer_name, order_id, order_number, created_at)
select 'System', 'added', 'shipment', s.id, s.tracking_number,
  o.customer_id, coalesce(c.customer_name, ''), s.order_id, coalesce(o.order_number, ''), s.created_at
from shipments s
left join orders o on o.id = s.order_id
left join customers c on c.id = o.customer_id;

insert into activity_log
  (actor_name, action, entity_type, entity_id, entity_label, created_at)
select 'System', 'added', 'product', id, name, created_at
from products;

insert into activity_log
  (actor_name, action, entity_type, entity_id, entity_label,
   customer_id, customer_name, order_id, order_number, created_at)
select coalesce(c.customer_name, 'Website'), 'raised', 'ticket', t.id, t.ticket_number,
  t.customer_id, coalesce(c.customer_name, ''), t.order_id, coalesce(o.order_number, ''), t.created_at
from tickets t
left join customers c on c.id = t.customer_id
left join orders o on o.id = t.order_id;
