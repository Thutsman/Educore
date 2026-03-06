-- ============================================================
-- MIGRATION 015 — Seed Standard School Departments
-- Inserts the standard department structure used in most
-- secondary schools. Safe to run multiple times (ON CONFLICT).
-- ============================================================

INSERT INTO departments (name, code) VALUES
  ('Administration',      'ADMIN'),
  ('Infant Department',   'INFANT'),
  ('Junior Department',   'JUNIOR'),
  ('Languages',           'LANG'),
  ('Mathematics',         'MATH'),
  ('Sciences',            'SCI'),
  ('Humanities',          'HUM'),
  ('Commercials',         'COMM'),
  ('Technical Subjects',  'TECH'),
  ('ICT',                 'ICT'),
  ('Arts',                'ARTS'),
  ('Physical Education',  'PE')
ON CONFLICT (code) DO NOTHING;
