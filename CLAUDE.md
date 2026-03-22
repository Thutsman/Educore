# Educore — CLAUDE.md

Project-specific instructions for Claude Code. These override default behaviour.

## Project

**Educore** — Integrated School Management System (ISMS)
**Stack:** React + TypeScript, Tailwind CSS v4, shadcn/ui, Supabase, React Router v6, React Hook Form + Zod, TanStack Query v5, Recharts

---

## Code Style & Conventions

- TypeScript strict mode — no `any` except the `const db = supabase as any` pattern in service files (required due to Supabase generated types resolving Insert/Update to `never`)
- Functional components only, no class components
- Named exports for components, default exports only for page-level route components
- File naming: `PascalCase.tsx` for components, `camelCase.ts` for utilities/services/hooks
- Use `@/` path aliases everywhere — never use relative `src/` imports
- After `npx shadcn@latest add`, always fix shadcn-generated imports from `src/` to `@/`

## Tailwind CSS

- Tailwind v4 — CSS-first config via `@theme` in `src/index.css`. There is **no** `tailwind.config.js`
- Use `@tailwindcss/vite` plugin (NOT the PostCSS plugin)
- Dark mode is handled via the `.dark` class on `<html>` — never use `prefers-color-scheme`

## Supabase Patterns

- Client: `import { supabase } from '@/lib/supabase'`
- For write operations (insert/update/delete/upsert): cast `const db = supabase as any` at the top of every service file
- Always check the migration SQL for exact column names, constraint names, and NOT NULL fields before writing service queries
- RLS policies are enforced — always include required fields like `marked_by`, `created_by`, etc. when inserting
- `onConflict` strings in upserts must exactly match the named UNIQUE constraint columns in the migration

## Forms

- React Hook Form + Zod for all forms
- `z.coerce.number()` fields: always cast `zodResolver(schema) as Resolver<FormValues>` and import `{ type Resolver } from 'react-hook-form'`

## State & Data Fetching

- TanStack Query for all server state — no raw `useEffect` for data fetching
- Mutations must return meaningful values (e.g. `boolean`) so callers can branch on success/failure
- Always invalidate relevant query keys in `onSuccess`

## Notifications / Toasts

- Use `sonner` for all toast notifications: `import { toast } from 'sonner'`
- `Toaster` is already mounted in `App.tsx` — do not add it again
- Show `toast.success(...)` on successful mutations and `toast.error(...)` on failure

## Database / Migrations

- Migrations live in `supabase/migrations/` — numbered sequentially
- Always read the relevant migration before writing a service query to confirm column names, constraints, and defaults
- Multi-school: most data is scoped by `school_id` (see migration 020). Include `school_id` when inserting/upserting on school-scoped tables (e.g. `attendance_records`, `invoices`, `students`).
- Key tables: `schools`, `students`, `classes`, `teachers`, `staff`, `profiles`, `attendance_records`, `invoices`, `payments`, `expenses`, `budgets`, `grades`, `exams`, `subjects`, `scheme_books`, `scheme_book_attachments`, `learning_resources`, `term_reports`, `assignments`, `assessments`, `lesson_plans`
- `attendance_records` unique constraint: `(student_id, date, period)` — column is `reason` (not `remarks`), `marked_by` and `school_id` are NOT NULL
- Soft deletes via `deleted_at` — always filter `.is('deleted_at', null)` on user-facing queries (**expenses** and **payments** have no `deleted_at`; for expenses use `.neq('status', 'rejected')` instead of a soft-delete filter)
- When debugging insert failures: check NOT NULL defaults first (e.g. `teachers.join_date` is `NOT NULL DEFAULT CURRENT_DATE` — omit the field to use the DB default; do not send `null`)

## School Admin Setup (key product decisions)

- School Admin setup steps are tracked via lightweight counts (see `useSchoolAdminSetupStats`). Step completion should invalidate the `['school-admin-setup', schoolId]` query key after relevant mutations.
- Class teacher (homeroom) assignment happens in **Staff → Allocations**, not as a required part of class creation. Class creation may leave homeroom as `null`.
- Timetable management supports an **All classes** view for admin/management roles (default), with an optional single-class view mode.
- `school_admin` UI should stay focused on setup/admin tasks. Hide teacher-only modules in sidebar and restrict direct access via `ProtectedRoute` (e.g. Scheme Book, Lesson Plans, Assignments, Assessments, Attendance).

## Supabase Multi-school gotchas (must align schema + UI)

- Uniqueness constraints must be per-school where appropriate (migration 020 pattern). If a concept can exist across multiple schools for the same user, avoid global UNIQUE constraints.
- Teachers/staff linking:
  - If a single user can be staff in multiple schools, enforce uniqueness as `(school_id, profile_id)` (see migration `037_teacher_profile_per_school.sql`).
  - Employee numbers should be unique per school: `(school_id, employee_no)` (migration 020).

## Finance & Bursar

- **Services & UI:** `src/features/finance/services/finance.ts` (reads/writes), `src/features/finance/hooks/useFinance.ts`, `src/features/finance/components/` (`FinancePage`, `InvoicesTab`, `ExpensesTab`, `FinanceReportsPage`, `FinanceTermSelector`). Bursar-only chart queries live in `src/services/dashboard.ts` (`getBursarChartStartDate`, `getMonthlyFinancials` → `{ points, chartStart, monthCount }`).
- **Invoices:** `balance` is a generated column — never recompute in app code. Filter `.is('deleted_at', null)`. Status enum includes `waived` (and `void`, etc. per migration).
- **Payments:** Date column is `payment_date`; optional `payment_no`. No `deleted_at`.
- **Expenses:** Use `expense_date`, `vendor`, `receipt_no` (not generic `date` / invoice-style names). No `deleted_at`. Status enum: `pending` | `approved` | `paid` | `rejected` — for reports and totals, exclude rejected with `.neq('status', 'rejected')`.
- **Budgets:** `allocated_amount`; filter `.is('deleted_at', null)`. Category enum matches **expenses**.
- **Students** on finance joins: `full_name` (single field).
- **CSV (finance line-item exports):** use `exportToCsv` from `@/utils/exportToCsv.ts`. The older object-row helpers in `src/utils/csv.ts` remain for other callers.
- **Finance routes:** `/finance` — controlled `tab` via query (`invoices` | `expenses`). Invoice list deep links: `?tab=invoices&filter=outstanding` (unpaid + partial + overdue) or `filter=overdue`. `getInvoices` maps `filter=outstanding` to `.in('status', [...])`.
- **Expense status in the product:** `createExpense` currently inserts `status: 'paid'`. The Expenses tab form has **no** status field; bursars cannot set pending/approved/rejected from the UI until the form and `updateExpense` (map to `vendor` / `receipt_no` / `status` as needed) are extended.

## Role Hierarchy

Headmaster > Deputy Headmaster > Bursar > HOD > Teacher / Class Teacher > Non-teaching > Parent > Student

## Dashboard Metrics

- Attendance rate = `(present + late) / (activeStudents × uniqueDaysRecorded) × 100`
  - Do NOT divide by total attendance records — that inflates the rate when only some students are recorded

## File Structure (key paths)

```
src/
  features/
    attendance/     services/, hooks/, components/, types.ts
    students/
    academics/
    finance/
    staff/
    assets/
    communication/
    dashboard/      hooks/, components/ (e.g. HeadmasterDashboard, TeacherDashboard)
    scheme-book/
    resources/
    parent-messages/
    reports/
    super-admin/
    analytics/
    assignments/
    assessments/
    lesson-plans/
    class-analytics/
    auth/           ProtectedRoute, useRoleRedirect
  services/         dashboard.ts, teacher-dashboard.ts, parent-dashboard.ts, hod-dashboard.ts
  components/ui/    shadcn components
  lib/              supabase.ts, validations/, query-client.ts
  utils/            cn.ts, format.ts, csv.ts, exportToCsv.ts
  context/          AuthContext.tsx
  pages/            route-level pages (LoginPage, SelectSchoolPage, etc.)
  layouts/         AppLayout.tsx, AuthLayout.tsx
```

## What NOT to Do

- Do not add `tailwind.config.js` — Tailwind v4 uses CSS config only
- Do not use `prefers-color-scheme` media queries
- Do not add the `Toaster` component anywhere other than `App.tsx`
- Do not use `remarks` as a column name — the DB column is `reason` in `attendance_records`
- Do not calculate attendance rate as `present / total_records` — see Dashboard Metrics above
- Do not create new files unless strictly necessary; prefer editing existing ones
- Do not add docstrings, comments, or type annotations to code that was not changed
