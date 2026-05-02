-- Deputy Headmaster: INSERT/DELETE on user_roles within their schools (Staff module parity with school_admin).

CREATE POLICY "user_roles_deputy_headmaster_insert" ON user_roles
  FOR INSERT WITH CHECK (
    has_any_role(ARRAY['deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );

CREATE POLICY "user_roles_deputy_headmaster_delete" ON user_roles
  FOR DELETE USING (
    has_any_role(ARRAY['deputy_headmaster']) AND
    school_id = ANY(get_user_school_ids())
  );
