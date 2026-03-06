-- ============================================================
-- MIGRATION 014 — Fix get_teacher_class_ids()
--
-- The original function only returned classes from teacher_subjects,
-- which meant a class teacher assigned via classes.class_teacher_id
-- (homeroom) but with no teacher_subjects entries could not see
-- their own class in any RLS policy.
--
-- This fix includes the homeroom class in the returned array.
-- ============================================================

CREATE OR REPLACE FUNCTION get_teacher_class_ids()
RETURNS UUID[]
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT ARRAY_AGG(DISTINCT class_id) FROM (
    -- Subject-teaching assignments
    SELECT ts.class_id
    FROM teacher_subjects ts
    WHERE ts.teacher_id = get_teacher_id()

    UNION

    -- Homeroom (class teacher) assignment
    SELECT c.id AS class_id
    FROM classes c
    WHERE c.class_teacher_id = get_teacher_id()
      AND c.deleted_at IS NULL
  ) sub
  WHERE class_id IS NOT NULL;
$$;
