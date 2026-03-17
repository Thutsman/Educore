-- ============================================================
-- MIGRATION 037 — Allow same profile in multiple schools
--
-- Multi-school setup: a single user (profile) may legitimately be a
-- teacher or staff member in more than one school. The original schema
-- enforced profile_id UNIQUE globally, which blocks that.
--
-- This migration changes teachers/staff uniqueness to be per-school.
-- ============================================================

-- teachers: replace global unique(profile_id) with unique(school_id, profile_id)
ALTER TABLE teachers DROP CONSTRAINT IF EXISTS teachers_profile_id_key;
ALTER TABLE teachers DROP CONSTRAINT IF EXISTS teachers_school_profile_id_key;
ALTER TABLE teachers ADD CONSTRAINT teachers_school_profile_id_key UNIQUE (school_id, profile_id);

-- staff: replace global unique(profile_id) with unique(school_id, profile_id)
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_profile_id_key;
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_school_profile_id_key;
ALTER TABLE staff ADD CONSTRAINT staff_school_profile_id_key UNIQUE (school_id, profile_id);

