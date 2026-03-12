-- ============================================================
-- MIGRATION 025 — Add Ndebele subject
-- ============================================================

INSERT INTO subjects (name, code, department_id, description, school_id)
SELECT
  'Ndebele',
  'NDEB',
  (SELECT id FROM departments WHERE code = 'LANG' LIMIT 1),
  'Ndebele language',
  s.id
FROM schools s
WHERE NOT EXISTS (
  SELECT 1 FROM subjects WHERE code = 'NDEB' AND school_id = s.id
);
