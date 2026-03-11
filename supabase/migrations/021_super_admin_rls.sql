-- 021_super_admin_rls.sql  –  Super-admin cross-school access

-- super_admin can read ALL profiles (needed to show user lists across schools)
DROP POLICY IF EXISTS "profiles_super_admin_select" ON profiles;
CREATE POLICY "profiles_super_admin_select" ON profiles
  FOR SELECT USING (has_role('super_admin'));

-- super_admin can manage ALL user_roles
DROP POLICY IF EXISTS "user_roles_super_admin_all" ON user_roles;
CREATE POLICY "user_roles_super_admin_all" ON user_roles
  FOR ALL USING (has_role('super_admin'));

-- super_admin can read ALL academic_years (to set current year per school)
DROP POLICY IF EXISTS "academic_years_super_admin_all" ON academic_years;
CREATE POLICY "academic_years_super_admin_all" ON academic_years
  FOR ALL USING (has_role('super_admin'));
