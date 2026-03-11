# Multi-School Requirements for Educore

This document outlines the schema and UI/UX changes required to support onboarding and operating multiple schools within a single Educore deployment (multi-tenant model).

---

## 1. Schema Changes

### 1.1 Add a `schools` Table

Introduce a central table for schools:

```sql
CREATE TABLE schools (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        UNIQUE,            -- e.g. "springfield-high"
  address     TEXT,
  phone       TEXT,
  email       TEXT,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
```

- Add an `updated_at` trigger consistent with other tables.
- RLS policies for `schools` should allow access based on `user_roles.school_id` (see §1.4).

---

### 1.2 Add `school_id` to School-Scoped Tables

All tables that conceptually belong to a single school must get a non-nullable `school_id` column referencing `schools(id)`.

**Core / academic / people:**

| Table             | Notes |
|-------------------|-------|
| `academic_years`  | One current year per school; adjust unique index to `(school_id, is_current)` where `is_current = true`. |
| `terms`           | Already tied to `academic_years`; ensure academic years are school-scoped. |
| `departments`     | Add `school_id`. |
| `classes`         | Add `school_id`. |
| `subjects`        | Add `school_id`. |
| `students`        | Add `school_id`. |
| `teachers`        | Add `school_id`. |
| `staff`           | Add `school_id`. |
| `guardians`       | Add `school_id` (or later a join table if guardians span schools). |

**Attendance / academics / assets:**

| Table / area           | Notes |
|------------------------|-------|
| `attendance_records`   | Add `school_id`. |
| Exams, grades, assignments | Add `school_id` to each. |
| Resources, assets, scheme-book | Add `school_id` to each. |

**Finance:**

| Table / area | Notes |
|--------------|-------|
| Invoices, payments, expenses, fee structures | Add `school_id` to each. |

**Communication:**

| Table / area | Notes |
|--------------|-------|
| Messages, notifications, parent messages | Add `school_id` to each. |

**Pattern for migrations:**

```sql
ALTER TABLE departments
  ADD COLUMN school_id UUID NOT NULL REFERENCES schools(id);

ALTER TABLE classes
  ADD COLUMN school_id UUID NOT NULL REFERENCES schools(id);

ALTER TABLE students
  ADD COLUMN school_id UUID NOT NULL REFERENCES schools(id);

-- Repeat for all school-scoped tables.
```

---

### 1.3 Update Unique Constraints to Be Per-School

Existing global uniques must become **per-school** so different schools do not clash.

**Examples:**

- **Students – admission number:**

  ```sql
  ALTER TABLE students
    DROP CONSTRAINT students_admission_no_key;

  ALTER TABLE students
    ADD CONSTRAINT students_admission_school_unique
    UNIQUE (school_id, admission_no);
  ```

- **Subjects – code:**

  ```sql
  ALTER TABLE subjects
    DROP CONSTRAINT subjects_code_key;

  ALTER TABLE subjects
    ADD CONSTRAINT subjects_school_code_unique
    UNIQUE (school_id, code);
  ```

- **Departments – code** (if unique): `UNIQUE (school_id, code)`.
- **Teachers – employee_no:** `UNIQUE (school_id, employee_no)`.
- **Staff – employee_no:** `UNIQUE (school_id, employee_no)`.

Apply the same pattern to any other columns that are currently globally unique but should be unique only within a school.

---

### 1.4 School-Aware Roles / Memberships

Current model:

- `user_roles (user_id, role_id)` — one row per user per role, global.

To support “same user, different roles per school”:

**Recommended: add `school_id` to `user_roles`.**

```sql
ALTER TABLE user_roles
  ADD COLUMN school_id UUID NOT NULL REFERENCES schools(id);

ALTER TABLE user_roles
  DROP CONSTRAINT user_roles_unique;

ALTER TABLE user_roles
  ADD CONSTRAINT user_roles_user_role_school_unique
  UNIQUE (user_id, role_id, school_id);
```

- A user can have Headmaster in School A and Teacher in School B.
- RLS can restrict data access to schools where the user has at least one role.

**Alternative:** A separate `user_schools` table with `(user_id, school_id)` and keep `user_roles` global; less flexible if permissions differ by school.

---

### 1.5 Row Level Security (RLS) Policies

For every school-scoped table, policies must:

1. Ensure the user has a role in that school (via `user_roles.school_id`).
2. Restrict rows to the user’s schools.

**Example – `students` SELECT:**

```sql
CREATE POLICY "students_select_by_school"
ON students
FOR SELECT
USING (
  school_id IN (
    SELECT school_id
    FROM user_roles
    WHERE user_id = auth.uid()
  )
);
```

**Example – `students` INSERT/UPDATE/DELETE:**

- `WITH CHECK (school_id IN (SELECT school_id FROM user_roles WHERE user_id = auth.uid()))`.

Apply equivalent policies to:

- `classes`, `teachers`, `staff`, `departments`, `subjects`, `guardians`
- `attendance_records`
- Finance tables (invoices, payments, expenses)
- Communication tables
- Any other school-scoped table

Also define RLS for `schools` so users can only see schools they belong to (e.g. `id IN (SELECT school_id FROM user_roles WHERE user_id = auth.uid())`).

---

### 1.6 Backfill Strategy (Existing Single-School Data)

1. Create the `schools` table and one row (e.g. “Default School”).
2. Add `school_id` columns as **nullable** first.
3. Backfill every row with the default school’s `id`.
4. Set `user_roles.school_id` for all existing rows to that same school id.
5. Alter columns to `NOT NULL` and add FKs/constraints.
6. Add or update RLS policies after data is consistent.

---

## 2. UI / UX Changes

### 2.1 Current School in Client State

- Introduce a **current school** in app state (e.g. React Context or auth context).
- After login, fetch the list of schools the user belongs to (e.g. via `user_roles` joined with `schools`).
- **If the user has one school:** auto-select it as current school.
- **If the user has multiple schools:** show a “Choose School” step (or persistent selector) before entering the main app.
- All data-fetching hooks and services should accept or derive `schoolId` and scope queries to it.

---

### 2.2 Global School Selector

- Add a **school switcher** in the main layout (e.g. top nav or sidebar):
  - Displays current school name (and optionally logo).
  - Dropdown listing all schools the user has access to.
- On change:
  - Update current school in context.
  - Invalidate or refetch TanStack Query caches so all data is re-fetched for the new school (query keys should include `schoolId`).

**Query key pattern:**

- `['students', { schoolId, ...filters }]`
- `['classes', { schoolId }]`
- `['dashboard-metrics', { schoolId, termId }]`

---

### 2.3 Scope All School-Scoped Pages and Components

- **Services:** Every school-scoped API/service call must:
  - Include a `school_id` filter (e.g. `.eq('school_id', schoolId)` in Supabase queries).
  - Set `school_id` on insert/upsert from the current school in context.
- **Forms:** When creating or editing students, classes, teachers, etc.:
  - Load only entities for the current school (e.g. classes list for dropdowns).
  - Do not allow picking entities from another school.
- **Dashboards:** Headmaster, Teacher, Parent dashboards should:
  - Receive or derive `schoolId` and pass it to all hooks/services.
  - Optionally display the current school name (e.g. “Dashboard – Springfield High”).
- **Lists and detail views:** All list/detail pages (students, staff, finance, attendance, etc.) must filter by the current `school_id`.

---

### 2.4 Onboarding and School Creation

- **First school:** Provide a flow (e.g. for first user or “super admin”) to create the first `schools` row and assign the creating user a role in that school.
- **Additional schools:** Restrict “Create School” (and possibly school-level settings) to a global admin role (e.g. super_admin) if you support multi-school management from one account.
- **User experience:**
  - On login, if the user has roles in multiple schools → show “Select School” (or school picker).
  - If only one school → go directly to that school’s dashboard.

---

## 3. Optional: Multi-Tenant vs Multi-Instance

- **Multi-tenant (single Supabase project):** One database, `school_id` on all school-scoped tables, RLS enforcing school isolation. This document assumes this model.
- **Multi-instance (one Supabase project per school):** No `school_id` in schema; each school gets its own project and frontend points to different Supabase URL/keys. Use only if you need strict physical separation or different regions per school.

For most cases, **single project + `school_id` + RLS** is simpler and easier to maintain.

---

## 4. Implementation Order

1. **Decide tenancy model:** Single Supabase project with `school_id` (recommended) vs one project per school.
2. **Create `schools` table** and add `school_id` to `user_roles` (with unique constraint).
3. **Add `school_id` to core tables** (academic_years, terms, departments, classes, subjects, students, teachers, staff, guardians, then attendance, finance, communication, etc.).
4. **Adjust unique constraints** to be per-school (admission_no, codes, employee_no, etc.).
5. **Write/update RLS policies** for all school-scoped tables and for `schools`.
6. **Backfill** existing data with a default school and set `user_roles.school_id`.
7. **Backend/services:** Add `schoolId` (or `school_id`) to all relevant service functions and Supabase queries; ensure inserts set `school_id`.
8. **Frontend:** Add school context, school selector, and thread `schoolId` through all pages and hooks; use `schoolId` in query keys.
9. **Test:** User with one school sees only that school’s data; user with two schools can switch and see isolated data per school.

---

## 5. Summary Checklist

| Area | Requirement |
|------|-------------|
| **Schema** | `schools` table; `school_id` on all school-scoped tables; per-school unique constraints; `user_roles.school_id` + unique `(user_id, role_id, school_id)`. |
| **RLS** | All school-scoped tables and `schools` restricted by `user_roles.school_id`; consistent SELECT/INSERT/UPDATE/DELETE policies. |
| **Backfill** | One default school; backfill `school_id` and `user_roles.school_id`; then NOT NULL and constraints. |
| **UI state** | Current school in context; list of user’s schools; auto-select when single school. |
| **UI components** | Global school switcher; all lists/forms/dashboards scoped by current school. |
| **Services** | Every school-scoped query filtered by `school_id`; every insert/update sets `school_id`; query keys include `schoolId`. |
| **Onboarding** | Create first school; optional “Create School” for super admin; school picker when user has multiple schools. |

This document can be used as the single source of requirements for the multi-school feature and for implementation tracking.
