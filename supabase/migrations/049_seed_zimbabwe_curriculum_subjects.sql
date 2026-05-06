-- ============================================================
-- MIGRATION 049 — Seed Zimbabwe curriculum subjects per school
-- Backfills missing subjects for existing schools.
-- Safe to re-run: each insert is guarded by (school_id, code).
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
    -- Sciences
    ('Combined Science', 'CSCI', 'SCI', 'Integrated science subject'),
    ('Practical', 'PRACT', 'SCI', 'Practical and applied subject track'),
    ('Crop Science', 'CROP', 'SCI', 'Crop production and agronomy'),
    ('Animal Science', 'ANSCI', 'SCI', 'Animal production and husbandry'),
    ('Sports Science', 'SPORT', 'SCI', 'Science of sport and physical performance'),

    -- Commercials
    ('Principles of Accounting', 'POA', 'COMM', 'Principles of accounting'),
    ('Commercial Studies', 'CSTUD', 'COMM', 'Commercial studies'),
    ('Guidance and Counselling', 'GUIDE', 'COMM', 'Guidance and counselling'),
    ('Mathematics Syl B', 'MATHB', 'COMM', 'Mathematics Syllabus B'),

    -- Humanities
    ('Family and Religious Studies', 'FRS', 'HUM', 'Family and religious studies'),
    ('Heritage Studies', 'HER', 'HUM', 'Heritage studies'),

    -- Languages
    ('IsiNdebele', 'ISNDEB', 'LANG', 'IsiNdebele language'),
    ('Ndebele Language', 'NDEBL', 'LANG', 'Ndebele language'),
    ('Literature in Ndebele', 'LITNDEB', 'LANG', 'Literature in Ndebele'),

    -- Mathematics
    ('Mathematics Syl A', 'MATHA', 'MATH', 'Mathematics Syllabus A'),
    ('Pure Mathematics', 'PMATH', 'MATH', 'Pure mathematics'),

    -- Technical / Vocational
    ('Technical Graphics and Design', 'TGD', 'TECH', 'Technical graphics and design'),
    ('Wood Technology and Design', 'WTD', 'TECH', 'Wood technology and design'),
    ('Textile Technology and Design', 'TTD', 'TECH', 'Textile technology and design'),

    -- Arts and PE
    ('Music', 'MUSIC', 'ARTS', 'Music'),
    ('Physical Education & Mass Displays', 'PEMD', 'PE', 'Physical education and mass displays')
) AS seed(name, code, department_code, description)
WHERE NOT EXISTS (
  SELECT 1
  FROM subjects existing
  WHERE existing.school_id = s.id
    AND existing.code = seed.code
);
