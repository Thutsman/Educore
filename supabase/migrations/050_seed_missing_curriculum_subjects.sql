-- ============================================================
-- MIGRATION 050 — Seed additional Zimbabwe curriculum subjects per school
-- Complements 049: History, English, Lit in English, CS (COMP), French, Art,
-- Statistics, Food Technology & Design. Safe to re-run per (school_id, code).
-- ============================================================

INSERT INTO subjects (name, code, department_id, description, school_id)
SELECT
  seed.name,
  seed.code,
  (
    SELECT d.id
    FROM departments d
    WHERE d.school_id = s.id
      AND d.code = seed.department_code
      AND d.deleted_at IS NULL
    LIMIT 1
  ) AS department_id,
  seed.description,
  s.id AS school_id
FROM schools s
CROSS JOIN (
  VALUES
    ('History', 'HIST', 'HUM', 'History'),
    ('Food Technology & Design', 'FTD', 'TECH', 'Food technology and design'),
    ('Statistics', 'STAT', 'MATH', 'Statistics'),
    ('Literature in English', 'LIT', 'LANG', 'Literature in English'),
    ('English', 'ENGLISH', 'LANG', 'English'),
    ('Computer Science', 'COMP', 'ICT', 'Computer science'),
    ('French', 'FRE', 'LANG', 'French language'),
    ('Art', 'ART', 'ARTS', 'Art')
) AS seed(name, code, department_code, description)
WHERE NOT EXISTS (
  SELECT 1
  FROM subjects existing
  WHERE existing.school_id = s.id
    AND existing.code = seed.code
);
