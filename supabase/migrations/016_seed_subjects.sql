-- ============================================================
-- MIGRATION 016 — Seed Standard School Subjects
-- Inserts common subjects so the Add Exam subject dropdown and
-- other academic forms have options. Safe to run multiple times.
-- ============================================================

INSERT INTO subjects (name, code, department_id, description) VALUES
  ('Mathematics',        'MATH',    (SELECT id FROM departments WHERE code = 'MATH' LIMIT 1), 'Core mathematics'),
  ('English Language',   'ENG',     (SELECT id FROM departments WHERE code = 'LANG' LIMIT 1), 'English language and literature'),
  ('English Literature',  'ENGLIT',  (SELECT id FROM departments WHERE code = 'LANG' LIMIT 1), 'Literature in English'),
  ('Shona',               'SHONA',   (SELECT id FROM departments WHERE code = 'LANG' LIMIT 1), 'Shona language'),
  ('Ndebele',             'NDEB',    (SELECT id FROM departments WHERE code = 'LANG' LIMIT 1), 'Ndebele language'),
  ('Physical Science',    'PHYSCI',  (SELECT id FROM departments WHERE code = 'SCI' LIMIT 1), 'Physics and Chemistry'),
  ('Biology',             'BIO',     (SELECT id FROM departments WHERE code = 'SCI' LIMIT 1), 'Biology'),
  ('Physics',             'PHY',     (SELECT id FROM departments WHERE code = 'SCI' LIMIT 1), 'Physics'),
  ('Chemistry',           'CHEM',    (SELECT id FROM departments WHERE code = 'SCI' LIMIT 1), 'Chemistry'),
  ('Geography',           'GEO',     (SELECT id FROM departments WHERE code = 'HUM' LIMIT 1), 'Geography'),
  ('History',             'HIST',    (SELECT id FROM departments WHERE code = 'HUM' LIMIT 1), 'History'),
  ('Accounts',            'ACC',     (SELECT id FROM departments WHERE code = 'COMM' LIMIT 1), 'Accounts'),
  ('Commerce',            'BS',      (SELECT id FROM departments WHERE code = 'COMM' LIMIT 1), 'Commerce'),
  ('Economics',           'ECON',    (SELECT id FROM departments WHERE code = 'COMM' LIMIT 1), 'Economics'),
  ('Computer Science',    'CS',      (SELECT id FROM departments WHERE code = 'ICT' LIMIT 1), 'Computer Science / ICT'),
  ('Technical Graphics',  'TECHGR',  (SELECT id FROM departments WHERE code = 'TECH' LIMIT 1), 'Technical graphics and design'),
  ('Physical Education',  'PE',      (SELECT id FROM departments WHERE code = 'PE' LIMIT 1), 'Physical Education'),
  ('Religious Studies',   'RE',      (SELECT id FROM departments WHERE code = 'HUM' LIMIT 1), 'Religious studies'),
  ('Agriculture',         'AGRIC',   (SELECT id FROM departments WHERE code = 'SCI' LIMIT 1), 'Agriculture')
ON CONFLICT (code) DO NOTHING;
