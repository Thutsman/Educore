# Educore — Role Assignment Guide

## Overview

Educore uses a role-based access control (RBAC) system backed by three Supabase database tables:

```
auth.users  ──►  profiles  ──►  user_roles  ──►  roles
(Supabase Auth)   (1 : 1)       (junction)        (lookup)
```

Roles are **not** assigned automatically when a user signs up. A new user gets a `profiles` row created automatically (via a database trigger), but they remain roleless until an administrator manually inserts a row into the `user_roles` table.

---

## Role Reference

| Role name | Typical person | What they can do |
|---|---|---|
| `headmaster` | School principal | Full system access. Can read and write every record, manage users, assign roles, override any record. Executive authority. |
| `deputy_headmaster` | Deputy principal | Full academic oversight. Can manage students, staff, academics, attendance, and communication. Cannot create or override financial records. |
| `bursar` | Finance officer | Full access to fees, invoices, payments, expenses, and payroll. Cannot view or edit academic grades. |
| `hod` | Head of Department | Academic management scoped to their own department — classes, subjects, grades, and attendance. Can view all student profiles. |
| `class_teacher` | Form/class teacher | Manages attendance and grades for their assigned class. Can send communication. Can view their class's student profiles. |
| `teacher` | Subject teacher | Records grades and attendance for the classes they are assigned to teach. Cannot view students outside their classes. |
| `non_teaching_staff` | Admin, librarian, support | Limited read access. Can view general school information. Cannot access grades, finance, or staff payroll. |
| `parent` | Guardian / parent | View-only access. Can see their own child's attendance, grades, fees, and notices. Cannot see any other student's data. |
| `student` | Learner | View-only access to their own record — timetable, grades, attendance, and fee balance. |

---

## Step-by-Step: Assigning a Role in the Supabase Dashboard

### Step 1 — Find the user's UUID

1. Open your Supabase project and go to **Authentication → Users**.
2. Find the user and copy their **UUID** (shown in the `id` column or in the user detail panel).
   This UUID is the same across `auth.users` and `profiles`.

> **Tip:** If you can't find the user in Authentication, they haven't signed up yet. Create them first via **Authentication → Users → Add user** (or invite via email). For parents, use the **Invite to portal** button on a student's Guardians card — see `docs/parent-onboarding-and-timetable.md`.

---

### Step 2 — Find the role UUID

1. Go to **Table Editor → `roles`**.
2. Find the row whose `name` matches the role you want to assign (e.g. `headmaster`).
3. Copy the `id` UUID for that role.

| Role name | Copy the `id` from this row |
|---|---|
| `headmaster` | row where `name = 'headmaster'` |
| `deputy_headmaster` | row where `name = 'deputy_headmaster'` |
| `bursar` | row where `name = 'bursar'` |
| `hod` | row where `name = 'hod'` |
| `class_teacher` | row where `name = 'class_teacher'` |
| `teacher` | row where `name = 'teacher'` |
| `non_teaching_staff` | row where `name = 'non_teaching_staff'` |
| `parent` | row where `name = 'parent'` |
| `student` | row where `name = 'student'` |

---

### Step 3 — Insert into `user_roles`

1. Go to **Table Editor → `user_roles`**.
2. Click **Insert → Insert row**.
3. Fill in the following columns:

| Column | Value |
|---|---|
| `user_id` | UUID from Step 1 (the user's profile UUID) |
| `role_id` | UUID from Step 2 (the role's UUID) |
| `assigned_by` | Your own profile UUID (optional — can be left null) |

4. Click **Save**.

---

### Step 4 — Verify

1. Go to **Table Editor → `user_roles`** and confirm the row appears.
2. Ask the user to sign out and sign back in.
   The app re-fetches the role on every login via `onAuthStateChange`.

---

## Alternative: Assign via SQL Editor

If you need to assign roles in bulk or prefer SQL, use the Supabase **SQL Editor**:

```sql
-- Assign a role by name (no need to look up UUIDs manually)
INSERT INTO user_roles (user_id, role_id)
VALUES (
  '<paste-user-uuid-here>',
  (SELECT id FROM roles WHERE name = 'headmaster')
)
ON CONFLICT (user_id, role_id) DO NOTHING;
```

Replace `'headmaster'` with any role name from the table above.

---

## Change or Remove a Role

### Remove a role

```sql
DELETE FROM user_roles
WHERE user_id = '<user-uuid>'
  AND role_id = (SELECT id FROM roles WHERE name = 'teacher');
```

### Reassign to a different role

Run the DELETE above first, then INSERT the new role. Or update in one statement:

```sql
UPDATE user_roles
SET role_id = (SELECT id FROM roles WHERE name = 'hod')
WHERE user_id = '<user-uuid>';
```

---

## Important Notes

- A user with **no role** can authenticate but cannot access any protected route — they will be redirected to `/unauthorized`.
- A user can technically have **multiple roles** in the `user_roles` table, but the app reads only the **first row** returned. Keep one role per user to avoid unpredictable behaviour.
- Role changes take effect on the user's **next login** (the session must be refreshed).
- All changes to `user_roles` are recorded in the **`audit_logs`** table automatically.
