-- Align assignments with multi-school pattern (app filters by school_id).
-- Live DB verified: assignments had no school_id column.

ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);

UPDATE assignments AS a
SET school_id = c.school_id
FROM classes AS c
WHERE a.class_id = c.id
  AND a.school_id IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM assignments WHERE school_id IS NULL) THEN
    RAISE EXCEPTION 'assignments.school_id: could not derive from classes; fix class_id / data then re-run migration';
  END IF;
END $$;

ALTER TABLE assignments
  ALTER COLUMN school_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_assignments_school ON assignments(school_id);
