-- Students can read assignments posted for their enrolled class.
CREATE POLICY "assignments_student_select" ON assignments
  FOR SELECT USING (
    has_role('student')
    AND class_id = (
      SELECT class_id
      FROM students
      WHERE profile_id = auth.uid()
        AND deleted_at IS NULL
      LIMIT 1
    )
  );
