-- Migration 4: short, name-based project URLs (slug) instead of the raw UUID.
-- Run once in the Supabase SQL editor. Safe to re-run (idempotent).
--
-- This only adds the column/index. Existing projects are backfilled from the
-- app (see the one-off backfill run in the deploy notes) since the slug
-- transliteration (Cyrillic -> Latin) lives in application code, not SQL.
-- New projects get a slug automatically going forward. Old /projects/<uuid>
-- links keep working either way (getProjectDetail falls back to id lookup).

alter table projects add column if not exists slug text;
create unique index if not exists projects_slug_unique on projects (slug);
