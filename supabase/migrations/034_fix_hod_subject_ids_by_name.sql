-- ============================================================
-- MIGRATION 034 — Fix get_hod_subject_ids() to match by subject name
-- Root cause: school-scoped subjects (school_id IS NOT NULL) have no
-- department_id set, while the HOD's department links to the global
-- seeded subjects. Both are named "Mathematics" but have different IDs.
-- Matching by name resolves this for all schools permanently.
-- Also backfills department_id on existing school-scoped subjects.
-- ============================================================

-- 1. Backfill department_id on school-scoped subjects that have none
--    by matching against the globally seeded subjects of the same name.
UPDATE subjects s_school
SET department_id = s_global.department_id
FROM subjects s_global
WHERE s_school.department_id IS NULL
  AND s_school.school_id IS NOT NULL
  AND LOWER(TRIM(s_school.name)) = LOWER(TRIM(s_global.name))
  AND s_global.department_id IS NOT NULL
  AND s_global.school_id IS NULL;

-- 2. Update get_hod_subject_ids() to match by subject name so school-scoped
--    subjects (even if department_id is still not set) are included.
CREATE OR REPLACE FUNCTION get_hod_subject_ids()
RETURNS UUID[]
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT ARRAY_AGG(DISTINCT s.id)
  FROM subjects s
  WHERE LOWER(TRIM(s.name)) IN (
    -- Names of subjects that belong to this HOD's department (matched by dept code)
    SELECT LOWER(TRIM(s2.name))
    FROM subjects s2
    JOIN departments sd ON sd.id = s2.department_id
    JOIN teachers    t  ON t.profile_id = auth.uid() AND t.deleted_at IS NULL
    JOIN departments td ON td.id = t.department_id
    WHERE sd.code = td.code
  );
$$;
