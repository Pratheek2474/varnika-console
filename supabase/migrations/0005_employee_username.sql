-- ============================================================================
-- 0005 — Username login (no emails).
-- Run this in the Supabase SQL Editor.
-- Usernames map to synthetic login emails (username@varnika.local).
-- ============================================================================

alter table employees
  add column username text not null default '';

-- Backfill from existing emails (prefix before @)
update employees
set username = split_part(email, '@', 1)
where username = '';

alter table employees
  add constraint employees_username_unique unique (username);
