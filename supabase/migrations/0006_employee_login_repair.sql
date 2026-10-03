-- ============================================================================
-- 0006 — Repair employee login columns.
-- SUPERSEDES 0004/0005 (those assumed employees.email existed; it didn't,
-- so they fail — do not run them, run only this file).
-- Result: employees has email + username (unique) + app_role, backfilled
-- for existing rows. Login matches username first, email second.
-- ============================================================================

alter table employees
  add column if not exists email text not null default '';

alter table employees
  add column if not exists app_role text not null default 'staff';

alter table employees
  add column if not exists username text not null default '';

-- Placeholder login emails for rows that never had one
update employees
set email = 'staff-' || substr(id::text, 1, 8) || '@varnika.local'
where email = '';

-- Usernames from the email prefix
update employees
set username = split_part(email, '@', 1)
where username = '';

-- Constraints (dropped first so this file is safely re-runnable)
alter table employees drop constraint if exists employees_app_role_check;
alter table employees
  add constraint employees_app_role_check
  check (app_role in ('admin', 'staff'));

alter table employees drop constraint if exists employees_email_unique;
alter table employees
  add constraint employees_email_unique unique (email);

alter table employees drop constraint if exists employees_username_unique;
alter table employees
  add constraint employees_username_unique unique (username);
