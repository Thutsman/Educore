-- ============================================================
-- MIGRATION 010 — Performance Indexes
-- FK columns + frequently filtered/sorted columns
-- ============================================================

-- ─── profiles ────────────────────────────────────────────────
CREATE INDEX idx_profiles_status ON profiles(status);

-- ─── user_roles ──────────────────────────────────────────────
CREATE INDEX idx_user_roles_user_id  ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id  ON user_roles(role_id);

-- ─── terms ───────────────────────────────────────────────────
CREATE INDEX idx_terms_academic_year ON terms(academic_year_id);
CREATE INDEX idx_terms_is_current    ON terms(is_current) WHERE is_current = true;

-- ─── departments ─────────────────────────────────────────────
CREATE INDEX idx_departments_hod     ON departments(hod_id);

-- ─── classes ─────────────────────────────────────────────────
CREATE INDEX idx_classes_academic_year ON classes(academic_year_id);
CREATE INDEX idx_classes_department    ON classes(department_id);
CREATE INDEX idx_classes_grade_level   ON classes(grade_level);

-- ─── subjects ────────────────────────────────────────────────
CREATE INDEX idx_subjects_department ON subjects(department_id);
CREATE INDEX idx_subjects_code       ON subjects(code);

-- ─── students ────────────────────────────────────────────────
CREATE INDEX idx_students_class      ON students(class_id);
CREATE INDEX idx_students_guardian   ON students(guardian_id);
CREATE INDEX idx_students_status     ON students(status);
CREATE INDEX idx_students_deleted_at ON students(deleted_at) WHERE deleted_at IS NULL;
-- Trigram index for fuzzy name search
CREATE INDEX idx_students_full_name_trgm ON students USING GIN (full_name gin_trgm_ops);

-- ─── teachers ────────────────────────────────────────────────
CREATE INDEX idx_teachers_profile    ON teachers(profile_id);
CREATE INDEX idx_teachers_department ON teachers(department_id);
CREATE INDEX idx_teachers_status     ON teachers(status);

-- ─── staff ───────────────────────────────────────────────────
CREATE INDEX idx_staff_profile       ON staff(profile_id);
CREATE INDEX idx_staff_department    ON staff(department_id);

-- ─── enrollments ─────────────────────────────────────────────
CREATE INDEX idx_enrollments_student      ON enrollments(student_id);
CREATE INDEX idx_enrollments_class        ON enrollments(class_id);
CREATE INDEX idx_enrollments_academic_yr  ON enrollments(academic_year_id);
CREATE INDEX idx_enrollments_status       ON enrollments(status);

-- ─── teacher_subjects ────────────────────────────────────────
CREATE INDEX idx_teacher_subjects_teacher  ON teacher_subjects(teacher_id);
CREATE INDEX idx_teacher_subjects_subject  ON teacher_subjects(subject_id);
CREATE INDEX idx_teacher_subjects_class    ON teacher_subjects(class_id);

-- ─── exams ───────────────────────────────────────────────────
CREATE INDEX idx_exams_class      ON exams(class_id);
CREATE INDEX idx_exams_subject    ON exams(subject_id);
CREATE INDEX idx_exams_term       ON exams(term_id);
CREATE INDEX idx_exams_date       ON exams(exam_date);

-- ─── grades ──────────────────────────────────────────────────
CREATE INDEX idx_grades_student  ON grades(student_id);
CREATE INDEX idx_grades_exam     ON grades(exam_id);

-- ─── report_cards ────────────────────────────────────────────
CREATE INDEX idx_report_cards_student      ON report_cards(student_id);
CREATE INDEX idx_report_cards_academic_yr  ON report_cards(academic_year_id);
CREATE INDEX idx_report_cards_term         ON report_cards(term_id);

-- ─── attendance_records ──────────────────────────────────────
CREATE INDEX idx_attendance_student  ON attendance_records(student_id);
CREATE INDEX idx_attendance_class    ON attendance_records(class_id);
CREATE INDEX idx_attendance_date     ON attendance_records(date);
CREATE INDEX idx_attendance_status   ON attendance_records(status);
-- Composite for daily class roll lookup
CREATE INDEX idx_attendance_class_date ON attendance_records(class_id, date);

-- ─── fee_structures ──────────────────────────────────────────
CREATE INDEX idx_fee_structures_class ON fee_structures(class_id);
CREATE INDEX idx_fee_structures_year  ON fee_structures(academic_year_id);

-- ─── invoices ────────────────────────────────────────────────
CREATE INDEX idx_invoices_student    ON invoices(student_id);
CREATE INDEX idx_invoices_status     ON invoices(status);
CREATE INDEX idx_invoices_due_date   ON invoices(due_date);
CREATE INDEX idx_invoices_deleted_at ON invoices(deleted_at) WHERE deleted_at IS NULL;

-- ─── payments ────────────────────────────────────────────────
CREATE INDEX idx_payments_invoice    ON payments(invoice_id);
CREATE INDEX idx_payments_student    ON payments(student_id);
CREATE INDEX idx_payments_date       ON payments(payment_date);

-- ─── payroll ─────────────────────────────────────────────────
CREATE INDEX idx_payroll_employee  ON payroll(employee_id);
CREATE INDEX idx_payroll_month_year ON payroll(year, month);
CREATE INDEX idx_payroll_status    ON payroll(status);

-- ─── expenses ────────────────────────────────────────────────
CREATE INDEX idx_expenses_date     ON expenses(expense_date);
CREATE INDEX idx_expenses_status   ON expenses(status);
CREATE INDEX idx_expenses_category ON expenses(category);

-- ─── assets ──────────────────────────────────────────────────
CREATE INDEX idx_assets_category   ON assets(category);
CREATE INDEX idx_assets_status     ON assets(status);
CREATE INDEX idx_assets_department ON assets(department_id);
CREATE INDEX idx_assets_deleted_at ON assets(deleted_at) WHERE deleted_at IS NULL;

-- ─── maintenance_logs ────────────────────────────────────────
CREATE INDEX idx_maintenance_asset  ON maintenance_logs(asset_id);
CREATE INDEX idx_maintenance_date   ON maintenance_logs(maintenance_date);
CREATE INDEX idx_maintenance_status ON maintenance_logs(status);

-- ─── announcements ───────────────────────────────────────────
CREATE INDEX idx_announcements_published ON announcements(is_published);
CREATE INDEX idx_announcements_expires   ON announcements(expires_at);
CREATE INDEX idx_announcements_deleted   ON announcements(deleted_at) WHERE deleted_at IS NULL;

-- ─── messages ────────────────────────────────────────────────
CREATE INDEX idx_messages_sender    ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_is_read   ON messages(is_read) WHERE is_read = false;

-- ─── notifications ───────────────────────────────────────────
CREATE INDEX idx_notifications_user    ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ─── audit_logs ──────────────────────────────────────────────
CREATE INDEX idx_audit_logs_user   ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table  ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_date   ON audit_logs(created_at DESC);
