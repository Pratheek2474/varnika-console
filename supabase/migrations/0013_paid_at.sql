-- 0013 — Payments are tracked on the order itself (is_paid), not a transactions page.
-- paid_at records when an order was marked paid so revenue can be bucketed by month.
-- Run in the Supabase SQL Editor. The old transactions table is left untouched.

alter table orders add column if not exists paid_at timestamptz;
update orders set paid_at = created_at where is_paid and paid_at is null;

create or replace function orders_set_paid_at() returns trigger
language plpgsql as $$
begin
  if new.is_paid then
    if tg_op = 'INSERT' or not coalesce(old.is_paid, false) then
      new.paid_at := now();
    end if;
  else
    new.paid_at := null;
  end if;
  return new;
end $$;

drop trigger if exists orders_set_paid_at_trg on orders;
create trigger orders_set_paid_at_trg before insert or update of is_paid on orders
  for each row execute function orders_set_paid_at();
