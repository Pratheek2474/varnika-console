-- ============================================================================
-- 0007 — Product subcategories + customer chat.
-- Run this in the Supabase SQL Editor.
-- Chat attachments linked to an order are fanned out into order_photos /
-- order_documents automatically, so they appear on the order page (and are
-- aggregated on the customer page) no matter which site adds them.
-- ============================================================================

alter table products
  add column if not exists subcategory text not null default '';

-- Conversations --------------------------------------------------------------

create table conversations (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid references customers (id) on delete cascade,
  order_id        uuid references orders (id) on delete set null,
  subject         text not null default '',
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now()
);
create index conversations_customer_id_idx on conversations (customer_id);
create index conversations_last_message_idx on conversations (last_message_at desc);

create table chat_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender          text not null check (sender in ('customer', 'staff')),
  sender_name     text not null default '',
  body            text not null default '',
  created_at      timestamptz not null default now()
);
create index chat_messages_conversation_idx
  on chat_messages (conversation_id, created_at);

create table chat_attachments (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  message_id      uuid references chat_messages (id) on delete cascade,
  order_id        uuid references orders (id) on delete set null,
  kind            text not null default 'photo' check (kind in ('photo', 'file')),
  url             text not null default '',
  name            text not null default '',
  size_text       text not null default '',
  created_at      timestamptz not null default now()
);
create index chat_attachments_conversation_idx
  on chat_attachments (conversation_id);
create index chat_attachments_order_idx on chat_attachments (order_id);

-- Triggers -------------------------------------------------------------------

-- Bump conversation freshness on every message
create or replace function touch_conversation()
returns trigger as $$
begin
  update conversations
  set last_message_at = NEW.created_at
  where id = NEW.conversation_id;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists chat_messages_touch_conversation on chat_messages;
create trigger chat_messages_touch_conversation
  after insert on chat_messages
  for each row execute function touch_conversation();

-- Fan out order-linked attachments into order photos/documents
create or replace function fanout_chat_attachment()
returns trigger as $$
begin
  if NEW.order_id is null then
    return NEW;
  end if;
  if NEW.kind = 'photo' then
    insert into order_photos (order_id, url, caption, uploaded_at)
    values (
      NEW.order_id,
      NEW.url,
      coalesce(nullif(NEW.name, ''), 'Chat photo'),
      NEW.created_at
    );
  else
    insert into order_documents (order_id, name, kind, size_text, url, uploaded_at)
    values (
      NEW.order_id,
      coalesce(nullif(NEW.name, ''), 'Chat file'),
      'other',
      NEW.size_text,
      NEW.url,
      NEW.created_at
    );
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists chat_attachments_fanout on chat_attachments;
create trigger chat_attachments_fanout
  after insert on chat_attachments
  for each row execute function fanout_chat_attachment();

-- Row Level Security (permissive for development, app enforces RBAC) ----------

alter table conversations    enable row level security;
alter table chat_messages    enable row level security;
alter table chat_attachments enable row level security;

create policy "dev_full_access" on conversations
  for all using (true) with check (true);
create policy "dev_full_access" on chat_messages
  for all using (true) with check (true);
create policy "dev_full_access" on chat_attachments
  for all using (true) with check (true);
