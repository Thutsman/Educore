# Parent Onboarding & Timetable

## Parent Onboarding (Invite to Portal)

Parents can access the Parent Dashboard to view their children's attendance, grades, fees, and messages. To onboard a parent:

1. **Configure Resend SMTP** (one-time setup):
   - Create a Resend account and verify your sending domain.
   - In Supabase Dashboard → **Auth → SMTP settings**, enter Resend's SMTP credentials (host, port, username, password, TLS).
   - This replaces Supabase's built-in email limits (3/hour on free tier) with Resend's plan.

2. **Invite a guardian**:
   - Go to **Students** → click a student → open the **Guardians** card.
   - For each guardian with an email, click **"Invite to portal"**.
   - The parent receives an email to set their password and log in.
   - Their account is linked to the guardian record and assigned the `parent` role.

3. **Portal access status**:
   - **Active**: Guardian has logged in and has portal access.
   - **Invite to portal**: Button shown when the guardian has an email but no account yet.
   - **Add an email to invite**: Shown when the guardian has no email recorded.

Only `school_admin`, `headmaster`, and `deputy_headmaster` can invite parents.

---

## Timetable

### Admin / HOD: Managing the Timetable

1. Go to **Timetable** (sidebar under Academic).
2. **Add periods**: Click "Add period" to define time slots (e.g. Period 1: 08:00–08:45).
3. **Select a class** and fill the grid:
   - Each row is a period, each column is a day (Mon–Fri).
   - Click **Add** in a cell to assign subject, teacher, and room.
   - The system prevents teacher double-booking (same teacher in overlapping slots).

### Teacher: Viewing the Timetable

- Teachers see **My Timetable** on their dashboard (today's lessons) and can open the full timetable via **Timetable** in the sidebar.
- Teachers see only their own lessons; they cannot edit the timetable.

---

## Teacher Workflow: Grades → Term Reports

1. **Enter grades**: Academics → Grade Entry → select exam → enter marks per student. Grades feed into Term Reports.
2. **Generate term reports**: Reports → Term Reports → choose term and class → click "Generate term reports".
3. **Edit comments**: Click the pencil icon on a report to add or edit the teacher comment.
