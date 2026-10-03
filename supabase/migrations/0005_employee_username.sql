-- ============================================================================
-- 0005 — SUPERSEDED by 0006. Do not run (assumed employees.email existed).
-- ============================================================================

alter table employees
  add column username text not null default '';

-- Backfill from existing emails (prefix before @)
update employees
set username = split_part(email, '@', 1)
where username = '';

alter table employees
  add constraint employees_username_unique unique (username);
