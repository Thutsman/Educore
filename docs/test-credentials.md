# Educore — Test Login Credentials

Demo accounts for each role. Created by `supabase/migrations/012_seed_login_credentials.sql`.

**Password for all accounts:** `Educore123!`

---

| Role | Email | Password |
|------|-------|----------|
| Headmaster | `headmaster@educore.test` | `Educore123!` |
| Deputy Headmaster | `deputy_headmaster@educore.test` | `Educore123!` |
| Bursar | `bursar@educore.test` | `Educore123!` |
| HOD | `hod@educore.test` | `Educore123!` |
| Class Teacher | `class_teacher@educore.test` | `Educore123!` |
| Teacher | `teacher@educore.test` | `Educore123!` |
| Non-teaching Staff | `non_teaching_staff@educore.test` | `Educore123!` |
| Parent | `parent@educore.test` | `Educore123!` |
| Student | `student@educore.test` | `Educore123!` |

---

## Usage

1. Run migrations 001–012 (including `012_seed_login_credentials.sql`).
2. Open the app at `http://localhost:5173/login`.
3. Sign in with any of the emails above and password `Educore123!`.

## Security

- **Development only** — do not use these credentials in production.
- Change or remove demo users before deploying.
- These accounts use the `@educore.test` domain, which is intended for local development.
