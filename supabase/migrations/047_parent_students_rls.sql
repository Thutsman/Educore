-- Allow parents to SELECT their own linked children
CREATE POLICY "students_parent_select" ON students
  FOR SELECT
  USING (
    has_role('parent') AND
    id = ANY(get_guardian_student_ids()) AND
    deleted_at IS NULL
  );
