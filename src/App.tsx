import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/query-client'
import { AuthProvider } from '@/context/AuthContext'
import { SchoolProvider } from '@/context/SchoolContext'
import { useAuth } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { LoginPage } from '@/pages/LoginPage'
import { UnauthorizedPage } from '@/pages/UnauthorizedPage'
import { SelectSchoolPage } from '@/pages/SelectSchoolPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import type { AppRole } from '@/types'

// ── Lazy-loaded auth / settings pages ────────────────────────────────────────
const ForgotPasswordPage = lazy(() =>
  import('@/pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage }))
)
const ResetPasswordPage = lazy(() =>
  import('@/pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage }))
)
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage }))
)

// ── Lazy-loaded dashboard pages ───────────────────────────────────────────────
const HeadmasterDashboard = lazy(() =>
  import('@/features/dashboard/components/HeadmasterDashboard').then(m => ({ default: m.HeadmasterDashboard }))
)
const DeputyDashboard = lazy(() =>
  import('@/features/dashboard/components/DeputyDashboard').then(m => ({ default: m.DeputyDashboard }))
)
const BursarDashboard = lazy(() =>
  import('@/features/dashboard/components/BursarDashboard').then(m => ({ default: m.BursarDashboard }))
)
const GeneralDashboard = lazy(() =>
  import('@/features/dashboard/components/GeneralDashboard').then(m => ({ default: m.GeneralDashboard }))
)
const HodDashboard = lazy(() =>
  import('@/features/dashboard/components/HodDashboard').then(m => ({ default: m.HodDashboard }))
)
const TeacherDashboard = lazy(() =>
  import('@/features/dashboard/components/TeacherDashboard').then(m => ({ default: m.TeacherDashboard }))
)
const ParentDashboard = lazy(() =>
  import('@/features/dashboard/components/ParentDashboard').then(m => ({ default: m.ParentDashboard }))
)

// ── Lazy-loaded feature modules ───────────────────────────────────────────────
const StudentList = lazy(() =>
  import('@/features/students').then(m => ({ default: m.StudentList }))
)
const StudentDetail = lazy(() =>
  import('@/features/students').then(m => ({ default: m.StudentDetail }))
)
const AcademicsPage = lazy(() =>
  import('@/features/academics').then(m => ({ default: m.AcademicsPage }))
)
const AttendancePage = lazy(() =>
  import('@/features/attendance').then(m => ({ default: m.AttendancePage }))
)
const FinancePage = lazy(() =>
  import('@/features/finance').then(m => ({ default: m.FinancePage }))
)
const CommunicationPage = lazy(() =>
  import('@/features/communication').then(m => ({ default: m.CommunicationPage }))
)
const StaffPage = lazy(() =>
  import('@/features/staff').then(m => ({ default: m.StaffPage }))
)
const AssetsPage = lazy(() =>
  import('@/features/assets').then(m => ({ default: m.AssetsPage }))
)
const AnalyticsPage = lazy(() =>
  import('@/features/analytics').then(m => ({ default: m.AnalyticsPage }))
)

// Academic modules (role-specific)
const SchemeBookPage = lazy(() =>
  import('@/features/scheme-book').then(m => ({ default: m.SchemeBookPage }))
)
const LessonPlansPage = lazy(() =>
  import('@/features/lesson-plans').then(m => ({ default: m.LessonPlansPage }))
)
const AssignmentsPage = lazy(() =>
  import('@/features/assignments').then(m => ({ default: m.AssignmentsPage }))
)
const ResourcesPage = lazy(() =>
  import('@/features/resources').then(m => ({ default: m.ResourcesPage }))
)
const AssessmentsPage = lazy(() =>
  import('@/features/assessments').then(m => ({ default: m.AssessmentsPage }))
)
const ParentMessagesPage = lazy(() =>
  import('@/features/parent-messages').then(m => ({ default: m.ParentMessagesPage }))
)
const TermReportsPage = lazy(() =>
  import('@/features/reports').then(m => ({ default: m.TermReportsPage }))
)
const ClassAnalyticsPage = lazy(() =>
  import('@/features/class-analytics').then(m => ({ default: m.ClassAnalyticsPage }))
)
const TimetablePage = lazy(() =>
  import('@/features/timetable').then(m => ({ default: m.TimetablePage }))
)
const SuperAdminPage = lazy(() =>
  import('@/features/super-admin').then(m => ({ default: m.SuperAdminPage }))
)
const SchoolAdminDashboard = lazy(() =>
  import('@/features/dashboard/components/SchoolAdminDashboard').then(m => ({ default: m.SchoolAdminDashboard }))
)

// ── Role → dashboard path mapping ────────────────────────────────────────────
const ROLE_DASHBOARD: Record<AppRole, string> = {
  school_admin:       '/dashboard/admin',
  headmaster:         '/dashboard/headmaster',
  deputy_headmaster:  '/dashboard/deputy',
  bursar:             '/dashboard/bursar',
  hod:                '/dashboard/hod',
  class_teacher:      '/dashboard/teacher',
  teacher:            '/dashboard/teacher',
  non_teaching_staff: '/dashboard/staff',
  parent:             '/dashboard/parent',
  student:            '/dashboard/student',
  super_admin:        '/admin',
}

function DashboardRedirect() {
  const { role, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }
  // Never send an authenticated user back to /login — fall back to the general
  // dashboard if the role is somehow null (e.g. missing profile row).
  const path = role ? (ROLE_DASHBOARD[role] ?? '/dashboard/general') : '/dashboard/general'
  return <Navigate to={path} replace />
}

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <BrowserRouter>
        <SchoolProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>

            {/* ── Public routes ── */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* ── Select school ── */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AuthLayout />}>
                <Route path="/select-school" element={<SelectSchoolPage />} />
              </Route>
            </Route>

            {/* ── Protected: all authenticated roles ── */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>

                {/* Dashboards */}
                <Route path="/dashboard">
                  <Route index element={<DashboardRedirect />} />
                  <Route element={<ProtectedRoute allowedRoles={['headmaster']} />}>
                    <Route path="headmaster" element={<HeadmasterDashboard />} />
                  </Route>
                  <Route element={<ProtectedRoute allowedRoles={['deputy_headmaster']} />}>
                    <Route path="deputy" element={<DeputyDashboard />} />
                  </Route>
                  <Route element={<ProtectedRoute allowedRoles={['bursar']} />}>
                    <Route path="bursar" element={<BursarDashboard />} />
                  </Route>
                  <Route element={<ProtectedRoute allowedRoles={['school_admin']} />}>
                    <Route path="admin" element={<SchoolAdminDashboard />} />
                  </Route>
                  <Route path="hod"     element={<HodDashboard />} />
                  <Route path="teacher" element={<TeacherDashboard />} />
                  <Route path="staff"   element={<GeneralDashboard />} />
                  <Route path="parent"  element={<ParentDashboard />} />
                  <Route path="student" element={<GeneralDashboard />} />
                  <Route path="general" element={<GeneralDashboard />} />
                </Route>

                {/* ── Students ── */}
                <Route
                  element={<ProtectedRoute allowedRoles={['school_admin','headmaster','deputy_headmaster','hod','class_teacher','teacher','bursar','non_teaching_staff']} />}
                >
                  <Route path="/students" element={<StudentList />} />
                  <Route path="/students/:id" element={<StudentDetail />} />
                </Route>

                {/* ── Academics ── */}
                <Route
                  element={<ProtectedRoute allowedRoles={['school_admin','headmaster','deputy_headmaster','hod','class_teacher','teacher']} />}
                >
                  <Route path="/academics/*" element={<AcademicsPage />} />
                  <Route path="/timetable" element={<TimetablePage />} />
                </Route>

                {/* ── Attendance ── */}
                <Route
                  element={<ProtectedRoute allowedRoles={['school_admin','headmaster','deputy_headmaster','hod','class_teacher','teacher']} />}
                >
                  <Route path="/attendance/*" element={<AttendancePage />} />
                </Route>

                {/* ── Subject Teacher modules ── */}
                <Route
                  element={<ProtectedRoute allowedRoles={['school_admin','headmaster','deputy_headmaster','hod','teacher']} />}
                >
                  <Route path="/scheme-book" element={<SchemeBookPage />} />
                  <Route path="/lesson-plans" element={<LessonPlansPage />} />
                  <Route path="/assignments" element={<AssignmentsPage />} />
                  <Route path="/assessments" element={<AssessmentsPage />} />
                  <Route path="/resources" element={<ResourcesPage />} />
                </Route>

                {/* ── Class Teacher modules ── */}
                <Route
                  element={<ProtectedRoute allowedRoles={['school_admin','headmaster','deputy_headmaster','hod','class_teacher']} />}
                >
                  <Route path="/parent-messages" element={<ParentMessagesPage />} />
                  <Route path="/reports" element={<TermReportsPage />} />
                  <Route path="/class-analytics" element={<ClassAnalyticsPage />} />
                </Route>

                {/* ── Finance ── */}
                <Route
                  element={<ProtectedRoute allowedRoles={['school_admin','headmaster','deputy_headmaster','bursar']} />}
                >
                  <Route path="/finance/*" element={<FinancePage />} />
                </Route>

                {/* ── Communication ── */}
                <Route path="/communication/*" element={<CommunicationPage />} />

                {/* ── Staff ── */}
                <Route
                  element={<ProtectedRoute allowedRoles={['school_admin','headmaster','deputy_headmaster']} />}
                >
                  <Route path="/staff/*" element={<StaffPage />} />
                </Route>

                {/* ── Assets ── */}
                <Route
                  element={<ProtectedRoute allowedRoles={['school_admin','headmaster','deputy_headmaster','non_teaching_staff']} />}
                >
                  <Route path="/assets/*" element={<AssetsPage />} />
                </Route>

                {/* ── Analytics ── */}
                <Route
                  element={<ProtectedRoute allowedRoles={['school_admin','headmaster','deputy_headmaster','bursar']} />}
                >
                  <Route path="/analytics/*" element={<AnalyticsPage />} />
                </Route>

                {/* ── Super Admin ── */}
                <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
                  <Route path="/admin" element={<SuperAdminPage />} />
                </Route>

                {/* ── Settings ── */}
                <Route path="/settings/*" element={<SettingsPage />} />
                <Route path="/users/*" element={
                  <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-border">
                    <p className="text-sm text-muted-foreground">User Management — coming soon</p>
                  </div>
                } />

              </Route>
            </Route>

            {/* Fallbacks */}
            <Route path="/"  element={<Navigate to="/dashboard" replace />} />
            <Route path="*"  element={<NotFoundPage />} />

          </Routes>
        </Suspense>
        </SchoolProvider>
      </BrowserRouter>
      </AuthProvider>

      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  )
}
