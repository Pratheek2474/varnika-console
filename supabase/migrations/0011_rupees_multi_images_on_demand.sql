-- 0011 — Rupees, multiple product photos, on-demand products, optional customer email.
-- Run in the Supabase SQL Editor.

alter table orders       alter column currency set default 'INR';
alter table transactions alter column currency set default 'INR';
update orders       set currency = 'INR' where currency = 'USD';
update transactions set currency = 'INR' where currency = 'USD';

alter table products
  add column if not exists images text[] not null default '{}',
  add column if not exists on_demand boolean not null default false;
update products set images = array[image_url] where image_url <> '' and images = '{}';

-- Customer email becomes optional (blank allowed, real emails still unique).
alter table customers alter column email set default '';
alter table customers alter column email drop not null;
alter table customers drop constraint if exists customers_email_key;
create unique index if not exists customers_email_unique_idx
  on customers (lower(email)) where email is not null and email <> '';
