-- Exams: introduce canonical assessment type + weighting percent fields
ALTER TABLE exams
  ADD COLUMN IF NOT EXISTS assessment_type TEXT,
  ADD COLUMN IF NOT EXISTS weighting_percent NUMERIC(5,2);

UPDATE exams
SET
  assessment_type = CASE
    WHEN exam_type IN ('test', 'quiz', 'practical') THEN exam_type
    ELSE 'exam'
  END,
  weighting_percent = COALESCE(weight, 100.00)
WHERE assessment_type IS NULL OR weighting_percent IS NULL;

ALTER TABLE exams
  ALTER COLUMN assessment_type SET DEFAULT 'exam',
  ALTER COLUMN weighting_percent SET DEFAULT 100.00;

ALTER TABLE exams
  ALTER COLUMN assessment_type SET NOT NULL,
  ALTER COLUMN weighting_percent SET NOT NULL;

ALTER TABLE exams
  DROP CONSTRAINT IF EXISTS exams_assessment_type_valid,
  ADD CONSTRAINT exams_assessment_type_valid
    CHECK (assessment_type IN ('exam', 'test', 'quiz', 'practical'));

ALTER TABLE exams
  DROP CONSTRAINT IF EXISTS exams_weighting_percent_valid,
  ADD CONSTRAINT exams_weighting_percent_valid
    CHECK (weighting_percent >= 0 AND weighting_percent <= 100);
