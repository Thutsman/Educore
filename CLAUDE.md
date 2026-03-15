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
- Key tables: `schools`, `students`, `classes`, `teachers`, `staff`, `profiles`, `attendance_records`, `invoices`, `payments`, `expenses`, `grades`, `exams`, `subjects`, `scheme_books`, `scheme_book_attachments`, `learning_resources`, `term_reports`, `assignments`, `assessments`, `lesson_plans`
- `attendance_records` unique constraint: `(student_id, date, period)` — column is `reason` (not `remarks`), `marked_by` and `school_id` are NOT NULL
- Soft deletes via `deleted_at` — always filter `.is('deleted_at', null)` on user-facing queries

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
  utils/            cn.ts, format.ts
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
