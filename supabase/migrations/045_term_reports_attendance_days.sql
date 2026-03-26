-- Add explicit attendance day counts to term reports
ALTER TABLE term_reports
  ADD COLUMN IF NOT EXISTS attendance_days_present INT,
  ADD COLUMN IF NOT EXISTS attendance_days_total INT;

ALTER TABLE term_reports
  DROP CONSTRAINT IF EXISTS term_reports_attendance_days_present_non_negative,
  ADD CONSTRAINT term_reports_attendance_days_present_non_negative
    CHECK (attendance_days_present IS NULL OR attendance_days_present >= 0);

ALTER TABLE term_reports
  DROP CONSTRAINT IF EXISTS term_reports_attendance_days_total_positive,
  ADD CONSTRAINT term_reports_attendance_days_total_positive
    CHECK (attendance_days_total IS NULL OR attendance_days_total >= 0);
