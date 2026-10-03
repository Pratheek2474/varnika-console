-- ============================================================================
-- 0004 — Employee login linkage.
-- Run this in the Supabase SQL Editor.
-- Links employees to Supabase Auth users by email (login matches on email).
-- Anyone with a dashboard-created login defaults to staff; promote to
-- admin via the employees table (app_role).
-- ============================================================================

-- Give pre-existing rows (seeded with blank emails) unique placeholders
update employees
set email = 'staff-' || substr(id::text, 1, 8) || '@varnika.local'
where email = '';

alter table employees
  add column app_role text not null default 'staff';

alter table employees
  add constraint employees_app_role_check
  check (app_role in ('admin', 'staff'));

alter table employees
  add constraint employees_email_unique unique (email);
