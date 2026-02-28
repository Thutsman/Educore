-- ============================================================
-- MIGRATION 009 — Row Level Security Policies
--
-- Policy naming convention: {table}_{role}_{operation}
-- Multiple SELECT policies per table are OR'd by Postgres.
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- PROFILES
-- ════════════════════════════════════════════════════════════

-- All authenticated users can read their own profile
CREATE POLICY "profiles_self_select" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Admins + HOD + Bursar can read all profiles
CREATE POLICY "profiles_admin_select" ON profiles
  FOR SELECT USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','bursar','hod'])
  );

-- Teachers can read profiles of students in their classes
CREATE POLICY "profiles_teacher_select" ON profiles
  FOR SELECT USING (
    has_any_role(ARRAY['teacher','class_teacher']) AND
    id IN (
      SELECT s.profile_id FROM students s
      WHERE s.class_id = ANY(get_teacher_class_ids())
        AND s.profile_id IS NOT NULL
    )
  );

-- Users can update their own profile
CREATE POLICY "profiles_self_update" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Headmaster can update any profile
CREATE POLICY "profiles_headmaster_update" ON profiles
  FOR UPDATE USING (has_role('headmaster'));

-- Profile INSERT is handled by the auth trigger (handle_new_user)
-- Headmaster can also manually insert
CREATE POLICY "profiles_headmaster_insert" ON profiles
  FOR INSERT WITH CHECK (has_role('headmaster') OR id = auth.uid());

-- Only headmaster can hard-delete profiles
CREATE POLICY "profiles_headmaster_delete" ON profiles
  FOR DELETE USING (has_role('headmaster'));


-- ════════════════════════════════════════════════════════════
-- ROLES & USER_ROLES
-- ════════════════════════════════════════════════════════════

CREATE POLICY "roles_all_select" ON roles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "roles_headmaster_all" ON roles
  FOR ALL USING (has_role('headmaster'));

-- All authenticated users can see their own role assignments
CREATE POLICY "user_roles_self_select" ON user_roles
  FOR SELECT USING (user_id = auth.uid());

-- Headmaster can see all role assignments
CREATE POLICY "user_roles_headmaster_select" ON user_roles
  FOR SELECT USING (has_role('headmaster'));

-- Only headmaster can assign/remove roles
CREATE POLICY "user_roles_headmaster_insert" ON user_roles
  FOR INSERT WITH CHECK (has_role('headmaster'));

CREATE POLICY "user_roles_headmaster_delete" ON user_roles
  FOR DELETE USING (has_role('headmaster'));


-- ════════════════════════════════════════════════════════════
-- ACADEMIC YEARS & TERMS
-- ════════════════════════════════════════════════════════════

-- All authenticated users can read academic years and terms
CREATE POLICY "academic_years_all_select" ON academic_years
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "terms_all_select" ON terms
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only headmaster/deputy can manage academic years and terms
CREATE POLICY "academic_years_admin_all" ON academic_years
  FOR ALL USING (has_any_role(ARRAY['headmaster','deputy_headmaster']));

CREATE POLICY "terms_admin_all" ON terms
  FOR ALL USING (has_any_role(ARRAY['headmaster','deputy_headmaster']));


-- ════════════════════════════════════════════════════════════
-- DEPARTMENTS
-- ════════════════════════════════════════════════════════════

CREATE POLICY "departments_all_select" ON departments
  FOR SELECT USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

-- Headmaster/Deputy can fully manage departments
CREATE POLICY "departments_admin_all" ON departments
  FOR ALL USING (has_any_role(ARRAY['headmaster','deputy_headmaster']));


-- ════════════════════════════════════════════════════════════
-- CLASSES
-- ════════════════════════════════════════════════════════════

-- Headmaster/Deputy see all classes
CREATE POLICY "classes_admin_select" ON classes
  FOR SELECT USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','bursar']) AND
    deleted_at IS NULL
  );

-- HOD sees classes in their department
CREATE POLICY "classes_hod_select" ON classes
  FOR SELECT USING (
    has_role('hod') AND
    department_id = get_hod_department_id() AND
    deleted_at IS NULL
  );

-- Teachers see classes they are assigned to
CREATE POLICY "classes_teacher_select" ON classes
  FOR SELECT USING (
    has_any_role(ARRAY['teacher','class_teacher']) AND
    id = ANY(get_teacher_class_ids()) AND
    deleted_at IS NULL
  );

-- Parents/Students see the class of their child/self
CREATE POLICY "classes_parent_select" ON classes
  FOR SELECT USING (
    has_role('parent') AND
    id IN (
      SELECT class_id FROM students
      WHERE id = ANY(get_guardian_student_ids())
    ) AND deleted_at IS NULL
  );

CREATE POLICY "classes_student_select" ON classes
  FOR SELECT USING (
    has_role('student') AND
    id = (SELECT class_id FROM students WHERE profile_id = auth.uid() LIMIT 1) AND
    deleted_at IS NULL
  );

-- Only headmaster/deputy can create or modify classes
CREATE POLICY "classes_admin_write" ON classes
  FOR INSERT WITH CHECK (has_any_role(ARRAY['headmaster','deputy_headmaster']));

CREATE POLICY "classes_admin_update" ON classes
  FOR UPDATE USING (has_any_role(ARRAY['headmaster','deputy_headmaster']));

CREATE POLICY "classes_admin_delete" ON classes
  FOR DELETE USING (has_role('headmaster'));


-- ════════════════════════════════════════════════════════════
-- SUBJECTS
-- ════════════════════════════════════════════════════════════

-- All teaching staff can see subjects
CREATE POLICY "subjects_staff_select" ON subjects
  FOR SELECT USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','hod','class_teacher','teacher']) AND
    deleted_at IS NULL
  );

-- Students/Parents can see subjects (limited)
CREATE POLICY "subjects_student_parent_select" ON subjects
  FOR SELECT USING (
    has_any_role(ARRAY['student','parent']) AND
    deleted_at IS NULL
  );

-- Admin + HOD can manage subjects
CREATE POLICY "subjects_admin_hod_write" ON subjects
  FOR ALL USING (has_any_role(ARRAY['headmaster','deputy_headmaster','hod']));


-- ════════════════════════════════════════════════════════════
-- STUDENTS
-- ════════════════════════════════════════════════════════════

-- Headmaster/Deputy see all students
CREATE POLICY "students_admin_select" ON students
  FOR SELECT USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster']) AND deleted_at IS NULL
  );

-- Bursar sees all students (for billing)
CREATE POLICY "students_bursar_select" ON students
  FOR SELECT USING (has_role('bursar') AND deleted_at IS NULL);

-- HOD sees students in their department's classes
CREATE POLICY "students_hod_select" ON students
  FOR SELECT USING (
    has_role('hod') AND
    class_id = ANY(get_hod_class_ids()) AND
    deleted_at IS NULL
  );

-- Teacher/Class Teacher sees students in their assigned classes
CREATE POLICY "students_teacher_select" ON students
  FOR SELECT USING (
    has_any_role(ARRAY['teacher','class_teacher']) AND
    class_id = ANY(get_teacher_class_ids()) AND
    deleted_at IS NULL
  );

-- Parents see their own children
CREATE POLICY "students_parent_select" ON students
  FOR SELECT USING (
    has_role('parent') AND
    id = ANY(get_guardian_student_ids()) AND
    deleted_at IS NULL
  );

-- Students see their own record
CREATE POLICY "students_self_select" ON students
  FOR SELECT USING (
    has_role('student') AND
    profile_id = auth.uid() AND
    deleted_at IS NULL
  );

-- Only headmaster can create/update students
CREATE POLICY "students_admin_insert" ON students
  FOR INSERT WITH CHECK (has_any_role(ARRAY['headmaster','deputy_headmaster']));

CREATE POLICY "students_admin_update" ON students
  FOR UPDATE USING (has_any_role(ARRAY['headmaster','deputy_headmaster']));

CREATE POLICY "students_headmaster_delete" ON students
  FOR DELETE USING (has_role('headmaster'));


-- ════════════════════════════════════════════════════════════
-- GUARDIANS
-- ════════════════════════════════════════════════════════════

CREATE POLICY "guardians_admin_select" ON guardians
  FOR SELECT USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','bursar']) AND deleted_at IS NULL
  );

-- Guardian can see their own record
CREATE POLICY "guardians_self_select" ON guardians
  FOR SELECT USING (profile_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "guardians_admin_write" ON guardians
  FOR ALL USING (has_any_role(ARRAY['headmaster','deputy_headmaster']));


-- ════════════════════════════════════════════════════════════
-- TEACHERS
-- ════════════════════════════════════════════════════════════

CREATE POLICY "teachers_admin_select" ON teachers
  FOR SELECT USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','bursar']) AND deleted_at IS NULL
  );

CREATE POLICY "teachers_hod_select" ON teachers
  FOR SELECT USING (
    has_role('hod') AND
    department_id = get_hod_department_id() AND
    deleted_at IS NULL
  );

-- Teacher can see their own record
CREATE POLICY "teachers_self_select" ON teachers
  FOR SELECT USING (profile_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "teachers_admin_write" ON teachers
  FOR ALL USING (has_any_role(ARRAY['headmaster','deputy_headmaster']));


-- ════════════════════════════════════════════════════════════
-- STAFF
-- ════════════════════════════════════════════════════════════

CREATE POLICY "staff_admin_select" ON staff
  FOR SELECT USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','bursar']) AND deleted_at IS NULL
  );

CREATE POLICY "staff_self_select" ON staff
  FOR SELECT USING (profile_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "staff_admin_write" ON staff
  FOR ALL USING (has_any_role(ARRAY['headmaster','deputy_headmaster']));


-- ════════════════════════════════════════════════════════════
-- TEACHER_SUBJECTS
-- ════════════════════════════════════════════════════════════

CREATE POLICY "teacher_subjects_admin_select" ON teacher_subjects
  FOR SELECT USING (has_any_role(ARRAY['headmaster','deputy_headmaster','hod']));

CREATE POLICY "teacher_subjects_teacher_select" ON teacher_subjects
  FOR SELECT USING (teacher_id = get_teacher_id());

CREATE POLICY "teacher_subjects_admin_write" ON teacher_subjects
  FOR ALL USING (has_any_role(ARRAY['headmaster','deputy_headmaster','hod']));


-- ════════════════════════════════════════════════════════════
-- ENROLLMENTS
-- ════════════════════════════════════════════════════════════

CREATE POLICY "enrollments_admin_select" ON enrollments
  FOR SELECT USING (has_any_role(ARRAY['headmaster','deputy_headmaster','bursar']));

CREATE POLICY "enrollments_teacher_select" ON enrollments
  FOR SELECT USING (
    has_any_role(ARRAY['teacher','class_teacher']) AND
    class_id = ANY(get_teacher_class_ids())
  );

CREATE POLICY "enrollments_parent_select" ON enrollments
  FOR SELECT USING (
    has_role('parent') AND student_id = ANY(get_guardian_student_ids())
  );

CREATE POLICY "enrollments_student_select" ON enrollments
  FOR SELECT USING (
    has_role('student') AND student_id = get_student_id()
  );

CREATE POLICY "enrollments_admin_write" ON enrollments
  FOR ALL USING (has_any_role(ARRAY['headmaster','deputy_headmaster']));


-- ════════════════════════════════════════════════════════════
-- EXAMS
-- ════════════════════════════════════════════════════════════

CREATE POLICY "exams_admin_select" ON exams
  FOR SELECT USING (has_any_role(ARRAY['headmaster','deputy_headmaster']));

CREATE POLICY "exams_hod_select" ON exams
  FOR SELECT USING (
    has_role('hod') AND class_id = ANY(get_hod_class_ids())
  );

-- Teachers see exams for classes they teach
CREATE POLICY "exams_teacher_select" ON exams
  FOR SELECT USING (
    has_any_role(ARRAY['teacher','class_teacher']) AND
    class_id = ANY(get_teacher_class_ids())
  );

CREATE POLICY "exams_parent_select" ON exams
  FOR SELECT USING (
    has_role('parent') AND
    class_id IN (
      SELECT class_id FROM students WHERE id = ANY(get_guardian_student_ids())
    )
  );

CREATE POLICY "exams_student_select" ON exams
  FOR SELECT USING (
    has_role('student') AND
    class_id = (SELECT class_id FROM students WHERE profile_id = auth.uid() LIMIT 1)
  );

-- Teachers can create exams for their classes
CREATE POLICY "exams_teacher_insert" ON exams
  FOR INSERT WITH CHECK (
    has_any_role(ARRAY['teacher','class_teacher','hod']) AND
    class_id = ANY(get_teacher_class_ids()) AND
    created_by = auth.uid()
  );

CREATE POLICY "exams_teacher_update" ON exams
  FOR UPDATE USING (
    has_any_role(ARRAY['teacher','class_teacher','hod']) AND
    class_id = ANY(get_teacher_class_ids())
  );

CREATE POLICY "exams_admin_write" ON exams
  FOR ALL USING (has_any_role(ARRAY['headmaster','deputy_headmaster']));


-- ════════════════════════════════════════════════════════════
-- GRADES
-- ════════════════════════════════════════════════════════════

CREATE POLICY "grades_admin_select" ON grades
  FOR SELECT USING (has_any_role(ARRAY['headmaster','deputy_headmaster']));

CREATE POLICY "grades_hod_select" ON grades
  FOR SELECT USING (
    has_role('hod') AND
    exam_id IN (SELECT id FROM exams WHERE class_id = ANY(get_hod_class_ids()))
  );

-- Teacher can see/enter grades for exams in their classes
CREATE POLICY "grades_teacher_select" ON grades
  FOR SELECT USING (
    has_any_role(ARRAY['teacher','class_teacher']) AND
    exam_id IN (
      SELECT e.id FROM exams e WHERE e.class_id = ANY(get_teacher_class_ids())
    )
  );

CREATE POLICY "grades_teacher_insert" ON grades
  FOR INSERT WITH CHECK (
    has_any_role(ARRAY['teacher','class_teacher','hod']) AND
    exam_id IN (
      SELECT e.id FROM exams e WHERE e.class_id = ANY(get_teacher_class_ids())
    ) AND
    marked_by = auth.uid()
  );

CREATE POLICY "grades_teacher_update" ON grades
  FOR UPDATE USING (
    has_any_role(ARRAY['teacher','class_teacher','hod']) AND
    exam_id IN (
      SELECT e.id FROM exams e WHERE e.class_id = ANY(get_teacher_class_ids())
    )
  );

-- Parents see grades of their children
CREATE POLICY "grades_parent_select" ON grades
  FOR SELECT USING (
    has_role('parent') AND
    student_id = ANY(get_guardian_student_ids())
  );

-- Students see their own grades
CREATE POLICY "grades_student_select" ON grades
  FOR SELECT USING (
    has_role('student') AND student_id = get_student_id()
  );

-- Headmaster override
CREATE POLICY "grades_headmaster_all" ON grades
  FOR ALL USING (has_role('headmaster'));


-- ════════════════════════════════════════════════════════════
-- REPORT CARDS
-- ════════════════════════════════════════════════════════════

CREATE POLICY "report_cards_admin_select" ON report_cards
  FOR SELECT USING (has_any_role(ARRAY['headmaster','deputy_headmaster']));

CREATE POLICY "report_cards_teacher_select" ON report_cards
  FOR SELECT USING (
    has_any_role(ARRAY['teacher','class_teacher']) AND
    class_id = ANY(get_teacher_class_ids())
  );

CREATE POLICY "report_cards_parent_select" ON report_cards
  FOR SELECT USING (
    has_role('parent') AND
    student_id = ANY(get_guardian_student_ids()) AND
    is_published = true
  );

CREATE POLICY "report_cards_student_select" ON report_cards
  FOR SELECT USING (
    has_role('student') AND
    student_id = get_student_id() AND
    is_published = true
  );

CREATE POLICY "report_cards_admin_write" ON report_cards
  FOR ALL USING (has_any_role(ARRAY['headmaster','deputy_headmaster']));

CREATE POLICY "report_cards_teacher_insert" ON report_cards
  FOR INSERT WITH CHECK (has_any_role(ARRAY['teacher','class_teacher']));


-- ════════════════════════════════════════════════════════════
-- ATTENDANCE RECORDS
-- ════════════════════════════════════════════════════════════

CREATE POLICY "attendance_admin_select" ON attendance_records
  FOR SELECT USING (has_any_role(ARRAY['headmaster','deputy_headmaster']));

CREATE POLICY "attendance_teacher_select" ON attendance_records
  FOR SELECT USING (
    has_any_role(ARRAY['teacher','class_teacher']) AND
    class_id = ANY(get_teacher_class_ids())
  );

CREATE POLICY "attendance_parent_select" ON attendance_records
  FOR SELECT USING (
    has_role('parent') AND student_id = ANY(get_guardian_student_ids())
  );

CREATE POLICY "attendance_student_select" ON attendance_records
  FOR SELECT USING (
    has_role('student') AND student_id = get_student_id()
  );

-- Teachers mark attendance for their classes
CREATE POLICY "attendance_teacher_insert" ON attendance_records
  FOR INSERT WITH CHECK (
    has_any_role(ARRAY['teacher','class_teacher']) AND
    class_id = ANY(get_teacher_class_ids()) AND
    marked_by = auth.uid()
  );

CREATE POLICY "attendance_teacher_update" ON attendance_records
  FOR UPDATE USING (
    has_any_role(ARRAY['teacher','class_teacher']) AND
    class_id = ANY(get_teacher_class_ids())
  );

CREATE POLICY "attendance_admin_write" ON attendance_records
  FOR ALL USING (has_any_role(ARRAY['headmaster','deputy_headmaster']));


-- ════════════════════════════════════════════════════════════
-- FINANCE: FEE STRUCTURES
-- ════════════════════════════════════════════════════════════

-- Bursar + headmaster have full access
CREATE POLICY "fee_structures_bursar_all" ON fee_structures
  FOR ALL USING (has_any_role(ARRAY['headmaster','bursar']));

-- Deputy can read
CREATE POLICY "fee_structures_deputy_select" ON fee_structures
  FOR SELECT USING (has_role('deputy_headmaster'));

-- Parents/Students can see fee structures
CREATE POLICY "fee_structures_parent_student_select" ON fee_structures
  FOR SELECT USING (has_any_role(ARRAY['parent','student']));


-- ════════════════════════════════════════════════════════════
-- FINANCE: INVOICES
-- ════════════════════════════════════════════════════════════

CREATE POLICY "invoices_bursar_headmaster_all" ON invoices
  FOR ALL USING (
    has_any_role(ARRAY['headmaster','bursar']) AND deleted_at IS NULL
  );

CREATE POLICY "invoices_deputy_select" ON invoices
  FOR SELECT USING (has_role('deputy_headmaster') AND deleted_at IS NULL);

-- Parents see invoices of their children
CREATE POLICY "invoices_parent_select" ON invoices
  FOR SELECT USING (
    has_role('parent') AND
    student_id = ANY(get_guardian_student_ids()) AND
    deleted_at IS NULL
  );

-- Students see their own invoices
CREATE POLICY "invoices_student_select" ON invoices
  FOR SELECT USING (
    has_role('student') AND
    student_id = get_student_id() AND
    deleted_at IS NULL
  );


-- ════════════════════════════════════════════════════════════
-- FINANCE: PAYMENTS
-- ════════════════════════════════════════════════════════════

CREATE POLICY "payments_bursar_headmaster_all" ON payments
  FOR ALL USING (has_any_role(ARRAY['headmaster','bursar']));

CREATE POLICY "payments_deputy_select" ON payments
  FOR SELECT USING (has_role('deputy_headmaster'));

CREATE POLICY "payments_parent_select" ON payments
  FOR SELECT USING (
    has_role('parent') AND
    student_id = ANY(get_guardian_student_ids())
  );

CREATE POLICY "payments_student_select" ON payments
  FOR SELECT USING (
    has_role('student') AND student_id = get_student_id()
  );


-- ════════════════════════════════════════════════════════════
-- FINANCE: PAYROLL
-- ════════════════════════════════════════════════════════════

CREATE POLICY "payroll_bursar_headmaster_all" ON payroll
  FOR ALL USING (has_any_role(ARRAY['headmaster','bursar']));

-- Employees can see their own payslips
CREATE POLICY "payroll_employee_self_select" ON payroll
  FOR SELECT USING (employee_id = auth.uid());


-- ════════════════════════════════════════════════════════════
-- FINANCE: EXPENSES
-- ════════════════════════════════════════════════════════════

CREATE POLICY "expenses_bursar_headmaster_all" ON expenses
  FOR ALL USING (has_any_role(ARRAY['headmaster','bursar']));

CREATE POLICY "expenses_deputy_select" ON expenses
  FOR SELECT USING (has_role('deputy_headmaster'));

-- Any staff can submit an expense
CREATE POLICY "expenses_staff_insert" ON expenses
  FOR INSERT WITH CHECK (
    has_any_role(ARRAY['teacher','class_teacher','non_teaching_staff','hod']) AND
    submitted_by = auth.uid()
  );

-- Staff can see their own submitted expenses
CREATE POLICY "expenses_staff_self_select" ON expenses
  FOR SELECT USING (submitted_by = auth.uid());


-- ════════════════════════════════════════════════════════════
-- ASSETS
-- ════════════════════════════════════════════════════════════

CREATE POLICY "assets_admin_bursar_all" ON assets
  FOR ALL USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster','bursar']) AND deleted_at IS NULL
  );

-- HOD can see assets in their department
CREATE POLICY "assets_hod_select" ON assets
  FOR SELECT USING (
    has_role('hod') AND
    department_id = get_hod_department_id() AND
    deleted_at IS NULL
  );


-- ════════════════════════════════════════════════════════════
-- MAINTENANCE LOGS
-- ════════════════════════════════════════════════════════════

CREATE POLICY "maintenance_admin_bursar_all" ON maintenance_logs
  FOR ALL USING (has_any_role(ARRAY['headmaster','deputy_headmaster','bursar']));

CREATE POLICY "maintenance_hod_select" ON maintenance_logs
  FOR SELECT USING (
    has_role('hod') AND
    asset_id IN (
      SELECT id FROM assets WHERE department_id = get_hod_department_id()
    )
  );


-- ════════════════════════════════════════════════════════════
-- ANNOUNCEMENTS
-- ════════════════════════════════════════════════════════════

-- All authenticated users can read published announcements targeting their role
CREATE POLICY "announcements_all_select" ON announcements
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    is_published = true AND
    deleted_at IS NULL AND (
      'all' = ANY(target_roles) OR
      get_user_role() = ANY(target_roles)
    )
  );

-- Admins can read all (including drafts)
CREATE POLICY "announcements_admin_select_all" ON announcements
  FOR SELECT USING (
    has_any_role(ARRAY['headmaster','deputy_headmaster']) AND deleted_at IS NULL
  );

-- Headmaster, Deputy, HOD, Bursar can create announcements
CREATE POLICY "announcements_staff_insert" ON announcements
  FOR INSERT WITH CHECK (
    has_any_role(ARRAY['headmaster','deputy_headmaster','bursar','hod']) AND
    created_by = auth.uid()
  );

-- Authors and admins can update
CREATE POLICY "announcements_author_update" ON announcements
  FOR UPDATE USING (
    created_by = auth.uid() OR has_any_role(ARRAY['headmaster','deputy_headmaster'])
  );

-- Only headmaster can delete
CREATE POLICY "announcements_headmaster_delete" ON announcements
  FOR DELETE USING (has_role('headmaster'));


-- ════════════════════════════════════════════════════════════
-- MESSAGES
-- ════════════════════════════════════════════════════════════

-- Users can see messages they sent or received
CREATE POLICY "messages_participants_select" ON messages
  FOR SELECT USING (
    (sender_id = auth.uid() OR recipient_id = auth.uid()) AND
    deleted_at IS NULL
  );

-- Any authenticated user can send a message
CREATE POLICY "messages_all_insert" ON messages
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND sender_id = auth.uid()
  );

-- Users can soft-delete their own messages
CREATE POLICY "messages_self_delete" ON messages
  FOR UPDATE USING (sender_id = auth.uid() OR recipient_id = auth.uid());


-- ════════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ════════════════════════════════════════════════════════════

-- Users can only see their own notifications
CREATE POLICY "notifications_self_select" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can mark their own notifications as read
CREATE POLICY "notifications_self_update" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- System/admins can insert notifications for any user (using service role or function)
CREATE POLICY "notifications_admin_insert" ON notifications
  FOR INSERT WITH CHECK (
    has_any_role(ARRAY['headmaster','deputy_headmaster','bursar','hod','teacher','class_teacher'])
  );


-- ════════════════════════════════════════════════════════════
-- AUDIT LOGS
-- ════════════════════════════════════════════════════════════

-- Only headmaster can read audit logs
CREATE POLICY "audit_logs_headmaster_select" ON audit_logs
  FOR SELECT USING (has_role('headmaster'));

-- Inserts happen only via the log_audit_event() trigger function (SECURITY DEFINER)
-- No direct INSERT policy needed for regular users
