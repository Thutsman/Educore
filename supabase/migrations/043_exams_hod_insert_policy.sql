-- ============================================================
-- 043 — Fix HOD exam write access
--
-- Current exams insert/update policies require class_id to be
-- in get_teacher_class_ids(), even for users with role 'hod'.
-- This blocks HOD from creating/editing exams (HTTP 400 from Supabase).
-- ============================================================

-- HOD can create exams for classes in their department
CREATE POLICY "exams_hod_insert"
ON exams
FOR INSERT
WITH CHECK (
  has_role('hod')
  AND class_id = ANY(get_hod_class_ids())
  AND created_by = auth.uid()
);

-- HOD can update exams for classes in their department
CREATE POLICY "exams_hod_update"
ON exams
FOR UPDATE
USING (
  has_role('hod')
  AND class_id = ANY(get_hod_class_ids())
);

-- HOD can delete exams for classes in their department
CREATE POLICY "exams_hod_delete"
ON exams
FOR DELETE
USING (
  has_role('hod')
  AND class_id = ANY(get_hod_class_ids())
);

