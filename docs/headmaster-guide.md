# Educore – Headmaster User Guide

## 1. Role Overview

As **Headmaster**, you are the primary administrator of Educore.

- **Access level**: Full system access (all modules).
- **Key abilities**:
  - Manage users and staff (create accounts, assign roles, link teachers).
  - Configure classes, subjects, exams, and academic structures.
  - View and override attendance and grades when necessary.
  - Manage finance data (invoices, payments, expenses, payroll).
  - View and manage assets and high‑level analytics.
  - Access all communication threads.

---

## 2. Logging In & Main Layout

1. Open the Educore URL and log in with your **email + password**.
2. After login you land on the **Headmaster Dashboard**:
   - High‑level stats for students, academics, attendance, and finance.
   - Quick cards and charts summarizing school status.

**Left sidebar** (always visible):

- **Overview**: Dashboard
- **Academic**: Students, Academics, Attendance
- **Finance**: Finance (Invoices & Payments, Expenses)
- **Communication**: Messages
- **Administration**: Staff, Assets, Analytics, (User Management – coming soon)
- **Settings**: Account & password

Click each item in the sidebar to open that module.

---

## 3. Students Module

### 3.1 View Students

- Go to **Students**.
- You can:
  - Search by name/admission number.
  - Open a **Student Detail** page to see profile, guardians, class, and academic info.

### 3.2 Manage Students

Depending on the current implementation, you can typically:

- Add new students (admission details, guardian, class).
- Edit existing student records (update class, status: active, graduated, etc.).
- View fee/invoice information linked to each student (read-only in this module; finance is in **Finance**).

---

## 4. Academics Module

Go to **Academics**. Tabs at the top usually include **Classes**, **Subjects**, **Exams**, and **Grade Entry**.

### 4.1 Classes – Managing Class Structures & Class Teachers

**Page:** `Academics → Classes`

You can:

- **Add Class**
  - Click **Add Class**.
  - Fill fields:
    - **Class Name** (e.g. “Form 2A”).
    - **Academic Year** (choose from list).
    - **Level (Form)** (numeric form/grade).
    - **Stream** (optional; e.g. “A”, “Science”).
    - **Class Teacher (Homeroom)**:
      - Select the teacher who will be the **class teacher** (homeroom).
      - This uses the `classes.class_teacher_id` field and powers “My Class” on the Teacher dashboard.
  - Click **Save**.

- **Edit Class**
  - Click the **pencil** icon on a class row.
  - Update the same fields, including **Class Teacher** if you want to reassign the homeroom.

- **Delete Class**
  - Click the **trash** icon.
  - Confirm deletion (students retain their history, but the class will be removed according to the app’s behavior).

### 4.2 Subjects

**Page:** `Academics → Subjects`

Typical actions:

- Create, edit, and deprecate subjects (name, code, department).
- Ensure subject list is consistent for exams, grade entry, and timetabling.

### 4.3 Exams

**Page:** `Academics → Exams`

You can:

- Create exams:
  - Set exam name, type (test, mid‑term, end‑term, etc.), class, subject, term, academic year, date, and total marks.
- Edit or delete existing exams.
- Control which exams appear to teachers for grade entry.

### 4.4 Grade Entry / Grades

**Page:** `Academics → Grade Entry`

As Headmaster:

- View grades for any exam.
- Depending on configuration, you may:
  - Edit grades directly.
  - Override or correct errors.

---

## 5. Attendance Module

**Page:** `Attendance`

You can:

- View attendance records by date, class, or student.
- Monitor daily attendance rates for each class.
- See teachers’ marking status (who has/hasn’t completed attendance).

In many setups, teachers/class teachers do the marking; you as Headmaster see the summary and can step in if necessary.

---

## 6. Finance Module

**Page:** `Finance`

Tabs generally include **Invoices & Payments** and **Expenses**.

### 6.1 Invoices & Payments

- **Create Invoice**
  - Click **Create Invoice**.
  - Choose **Student**.
  - Enter **amount**, **academic year**, optional **term**, **due date**, and **description** (e.g. Term 2 Fees).
  - Save – this creates a fee invoice for the student.

- **View Invoice Details**
  - Click an invoice row to open **Invoice Detail** modal.
  - See: invoice number, student, class, issued date, due date, description, amount, paid amount, and balance.
  - If there are payments, see **Payment History**.

- **Record Payment**
  - In Invoice Detail, click **Record Payment** (if invoice not fully paid).
  - Enter **amount**, **date**, **method** (cash, bank transfer, mobile money, cheque, other), and optional reference.
  - Save – this creates a payment, updates `amount_paid` and `balance`, and changes status (unpaid, partial, or paid).

- **Void Invoice**
  - In the Invoice detail, click **Void** (for errors or cancelled charges).
  - This sets status to `void` and removes it from outstanding totals.

### 6.2 Expenses

- Add and manage school expenses (category, description, amount, date, vendor, payment status).
- Analyze expense categories via reports and dashboards.

---

## 7. Communication Module

**Page:** `Messages`

You can:

- Post announcements/messages to different audiences (teachers, parents, students, etc.).
- Read all messages and system logs of communications.
- As Headmaster, you typically have full ability to post and manage any communication thread.

---

## 8. Staff Management

**Page:** `Staff`

Tabs: **Teachers** and **Non‑Teaching Staff**.

### 8.1 Creating User Accounts (Login Credentials)

**Teachers tab → Create User Account**

1. Click **Create User Account**.
2. Fill:
   - **Full Name**
   - **Email**
   - **Temporary Password**
   - **Phone** (optional)
   - **Role**: `teacher` or `class_teacher`
3. Submit:
   - Creates a Supabase **auth user** and **profile**.
   - Assigns the selected role.
   - The account appears in **Unlinked User Accounts** until you link it to a teacher record.

### 8.2 Linking User Accounts as Teachers

**Unlinked User Accounts** (bottom of Teachers tab):

- Newly created accounts appear here.
- Click **Link as Teacher** for a row:
  - This opens the **Add Teacher** form with the user pre‑selected.

### 8.3 Add / Edit Teacher (Teacher employment record)

**Add Teacher**:

1. Click **Add Teacher** (top‑right on Teachers tab).
2. In the **User Account** dropdown, choose an unlinked account.
3. Fill:
   - **Employee No.**
   - **Status** (active, inactive, on leave)
   - **Department**
   - **Employment Type** (permanent, contract, part time)
   - **Qualification**
   - **Specialization**
   - **Join Date**
4. Save:
   - Creates a `teachers` row linked to the profile.
   - Teacher now appears in the Teachers list and can be assigned as a **Class Teacher** in the Academics → Classes form.

**Edit Teacher**:

- Click a teacher row to open the **Edit Teacher** modal.
- Update employment information as needed.

### 8.4 Non‑Teaching Staff

**Non‑Teaching Staff** tab:

- View staff list.
- (Depending on implementation) add or manage non‑teaching staff with employee numbers, departments, and status.

---

## 9. Assets Module

**Page:** `Assets`

As Headmaster you can:

- View and manage school assets (equipment, furniture, etc.).
- Track asset status and, if enabled, maintenance logs.
- Assign responsibility for assets to staff or departments.

---

## 10. Analytics Module

**Page:** `Analytics`

- High‑level overview of:
  - Enrolment
  - Fees collected vs outstanding
  - Attendance patterns
  - Academic performance trends
- Designed for decision‑making rather than data entry.

---

## 11. Settings and Account Management

**Page:** `Settings`

You can:

- Change your **password**.
- Manage personal profile information (name, phone, avatar).
- See basic system information.

---

## 12. Typical Headmaster Workflows (Quick Reference)

- **Onboard a new teacher & assign a class**
  1. **Staff → Teachers → Create User Account** (role `teacher` or `class_teacher`).
  2. **Staff → Teachers → Link as Teacher / Add Teacher** to create the teacher record.
  3. **Academics → Classes → Edit Class → Class Teacher** to assign as homeroom.

- **Create a new fee invoice**
  1. **Finance → Invoices & Payments → Create Invoice**.
  2. Select **Student**, amount, academic year/term, due date, description.
  3. Save.

- **Record a payment**
  1. Open invoice (click row).
  2. Click **Record Payment**.
  3. Enter amount, date, method, reference.
  4. Save.

- **Check teacher performance & class status**
  1. **Dashboard → Headmaster** for global stats.
  2. **Attendance** for daily attendance.
  3. **Academics → Exams / Grade Entry** for exam coverage and performance.

