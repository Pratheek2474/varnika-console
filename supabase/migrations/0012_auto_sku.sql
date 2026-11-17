-- 0012 — Auto-generate product SKUs (e.g. VAR-BLO-0001). Run in the Supabase SQL Editor.

create sequence if not exists products_sku_seq;

create or replace function products_set_sku() returns trigger
language plpgsql as $$
begin
  if new.sku is null or btrim(new.sku) = '' then
    new.sku := 'VAR-'
      || upper(left(regexp_replace(coalesce(nullif(new.category, ''), 'GEN'), '[^a-zA-Z]', '', 'g') || 'XXX', 3))
      || '-' || lpad(nextval('products_sku_seq')::text, 4, '0');
  end if;
  return new;
end $$;

drop trigger if exists products_set_sku_trg on products;
create trigger products_set_sku_trg before insert on products
  for each row execute function products_set_sku();
