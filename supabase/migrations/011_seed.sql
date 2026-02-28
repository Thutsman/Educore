-- ============================================================
-- MIGRATION 011 — Seed Data
-- Inserts the 9 base roles. Run once after all migrations.
-- ============================================================

INSERT INTO roles (name, description) VALUES
  ('headmaster',         'Full system access. Executive authority.'),
  ('deputy_headmaster',  'Academic oversight. Cannot override financial records.'),
  ('bursar',             'Finance management. No access to academic grades.'),
  ('hod',                'Head of Department. Academic management for their department.'),
  ('class_teacher',      'Class teacher. Attendance, grades, and communication for their class.'),
  ('teacher',            'Subject teacher. Grades and attendance for assigned classes.'),
  ('non_teaching_staff', 'Administrative staff. Limited system access.'),
  ('parent',             'Guardian/parent. View-only access to own child data.'),
  ('student',            'Student portal. View-only access to own data.')
ON CONFLICT (name) DO NOTHING;

-- ─── Example academic year (edit dates as needed) ────────────
-- INSERT INTO academic_years (label, start_date, end_date, is_current)
-- VALUES ('2025/2026', '2025-01-20', '2025-11-28', true);

-- ─── Example terms ───────────────────────────────────────────
-- INSERT INTO terms (academic_year_id, name, start_date, end_date, is_current)
-- VALUES
--   ((SELECT id FROM academic_years WHERE is_current = true), 'Term 1', '2025-01-20', '2025-04-04', true),
--   ((SELECT id FROM academic_years WHERE is_current = true), 'Term 2', '2025-05-06', '2025-08-08', false),
--   ((SELECT id FROM academic_years WHERE is_current = true), 'Term 3', '2025-09-09', '2025-11-28', false);
