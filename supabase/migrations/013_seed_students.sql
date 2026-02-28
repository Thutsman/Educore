-- ============================================================
-- MIGRATION 013 — Seed 10 Student Records
-- Inserts academic year, terms, departments, classes, guardians,
-- and 10 sample students. Idempotent where possible.
-- ============================================================

-- ─── Academic year (if none exists) ───────────────────────────
INSERT INTO academic_years (label, start_date, end_date, is_current)
SELECT '2025/2026', '2025-01-20'::date, '2025-11-28'::date, true
WHERE NOT EXISTS (SELECT 1 FROM academic_years LIMIT 1);

-- ─── Terms (if none exist) ────────────────────────────────────
INSERT INTO terms (academic_year_id, name, start_date, end_date, is_current)
SELECT id, 'Term 1', '2025-01-20'::date, '2025-04-04'::date, true
  FROM academic_years WHERE is_current = true
  AND NOT EXISTS (SELECT 1 FROM terms LIMIT 1)
LIMIT 1;

INSERT INTO terms (academic_year_id, name, start_date, end_date, is_current)
SELECT id, 'Term 2', '2025-05-06'::date, '2025-08-08'::date, false
  FROM academic_years WHERE is_current = true
  AND EXISTS (SELECT 1 FROM terms) AND NOT EXISTS (SELECT 1 FROM terms WHERE name = 'Term 2')
LIMIT 1;

INSERT INTO terms (academic_year_id, name, start_date, end_date, is_current)
SELECT id, 'Term 3', '2025-09-09'::date, '2025-11-28'::date, false
  FROM academic_years WHERE is_current = true
  AND EXISTS (SELECT 1 FROM terms) AND NOT EXISTS (SELECT 1 FROM terms WHERE name = 'Term 3')
LIMIT 1;

-- ─── Departments (if none exist) ───────────────────────────────
INSERT INTO departments (name, code, description)
SELECT 'Sciences', 'SCI', 'Science department'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE code = 'SCI');

INSERT INTO departments (name, code, description)
SELECT 'Humanities', 'HUM', 'Humanities department'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE code = 'HUM');

-- ─── Classes (if none exist) ───────────────────────────────────
INSERT INTO classes (name, grade_level, academic_year_id, capacity, room)
SELECT 'Form 1A', 1, (SELECT id FROM academic_years WHERE is_current = true LIMIT 1), 40, 'Room 1'
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE name = 'Form 1A' AND academic_year_id = (SELECT id FROM academic_years WHERE is_current = true LIMIT 1));

INSERT INTO classes (name, grade_level, academic_year_id, capacity, room)
SELECT 'Form 1B', 1, (SELECT id FROM academic_years WHERE is_current = true LIMIT 1), 40, 'Room 2'
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE name = 'Form 1B' AND academic_year_id = (SELECT id FROM academic_years WHERE is_current = true LIMIT 1));

INSERT INTO classes (name, grade_level, academic_year_id, capacity, room)
SELECT 'Form 2A', 2, (SELECT id FROM academic_years WHERE is_current = true LIMIT 1), 40, 'Room 3'
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE name = 'Form 2A' AND academic_year_id = (SELECT id FROM academic_years WHERE is_current = true LIMIT 1));

INSERT INTO classes (name, grade_level, academic_year_id, capacity, room)
SELECT 'Form 3A', 3, (SELECT id FROM academic_years WHERE is_current = true LIMIT 1), 40, 'Room 5'
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE name = 'Form 3A' AND academic_year_id = (SELECT id FROM academic_years WHERE is_current = true LIMIT 1));

-- ─── Guardians ────────────────────────────────────────────────
INSERT INTO guardians (full_name, relationship, phone, email, address)
SELECT * FROM (VALUES
  ('John Moyo', 'father', '+263771234567', 'john.moyo@example.com', '12 Borrowdale Road, Harare'),
  ('Sarah Moyo', 'mother', '+263772345678', 'sarah.moyo@example.com', '12 Borrowdale Road, Harare'),
  ('Michael Ndlovu', 'father', '+263773456789', NULL, '45 Main Street, Bulawayo'),
  ('Grace Ncube', 'mother', '+263774567890', 'grace.ncube@example.com', '7 Hillside, Harare'),
  ('Peter Sibanda', 'guardian', '+263775678901', 'peter.sibanda@example.com', '23 Mbare, Harare'),
  ('Elizabeth Dube', 'mother', '+263776789012', 'elizabeth.dube@example.com', '56 Avondale, Harare')
) AS t(full_name, relationship, phone, email, address)
WHERE NOT EXISTS (SELECT 1 FROM guardians WHERE full_name = t.full_name AND phone = t.phone);

-- ─── 10 Students ──────────────────────────────────────────────
INSERT INTO students (admission_no, full_name, date_of_birth, gender, address, class_id, guardian_id, guardian2_id, admission_date, status)
SELECT s.adm, s.name, s.dob::date, s.gender, s.addr, c.id, g1.id, g2.id, s.adm_date::date, 'active'
FROM (VALUES
  ('2025-001', 'Tendai Moyo', '2010-03-15', 'male', '12 Borrowdale Road, Harare', 'Form 1A', 'John Moyo', 'Sarah Moyo', '2025-01-20'),
  ('2025-002', 'Rumbidzai Moyo', '2010-07-22', 'female', '12 Borrowdale Road, Harare', 'Form 1A', 'John Moyo', 'Sarah Moyo', '2025-01-20'),
  ('2025-003', 'Blessing Ndlovu', '2009-11-08', 'male', '45 Main Street, Bulawayo', 'Form 2A', 'Michael Ndlovu', NULL, '2025-01-20'),
  ('2025-004', 'Tarisai Ncube', '2010-01-30', 'female', '7 Hillside, Harare', 'Form 1B', 'Grace Ncube', NULL, '2025-01-20'),
  ('2025-005', 'Tadiwa Sibanda', '2008-05-12', 'male', '23 Mbare, Harare', 'Form 3A', 'Peter Sibanda', NULL, '2025-01-20'),
  ('2025-006', 'Chiedza Dube', '2009-09-18', 'female', '56 Avondale, Harare', 'Form 2A', 'Elizabeth Dube', NULL, '2025-01-20'),
  ('2025-007', 'Kudakwashe Banda', '2010-04-25', 'male', '88 Greendale, Harare', 'Form 1A', 'John Moyo', NULL, '2025-01-20'),
  ('2025-008', 'Ruvimbo Chikwanha', '2009-12-03', 'female', '15 Highlands, Harare', 'Form 2A', 'Grace Ncube', NULL, '2025-01-20'),
  ('2025-009', 'Tinotenda Mapfumo', '2010-06-14', 'male', '33 Marlborough, Harare', 'Form 1B', 'Peter Sibanda', NULL, '2025-01-20'),
  ('2025-010', 'Nyasha Mutasa', '2009-08-29', 'female', '42 Borrowdale, Harare', 'Form 3A', 'Elizabeth Dube', NULL, '2025-01-20')
) AS s(adm, name, dob, gender, addr, class_name, g1_name, g2_name, adm_date)
LEFT JOIN classes c ON c.name = s.class_name AND c.academic_year_id = (SELECT id FROM academic_years WHERE is_current = true LIMIT 1)
LEFT JOIN guardians g1 ON g1.full_name = s.g1_name
LEFT JOIN guardians g2 ON g2.full_name = s.g2_name
WHERE NOT EXISTS (SELECT 1 FROM students st WHERE st.admission_no = s.adm);
