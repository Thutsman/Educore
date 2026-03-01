import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/query-client'
import { AuthProvider } from '@/context/AuthContext'
import { useAuth } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { LoginPage } from '@/pages/LoginPage'
import { UnauthorizedPage } from '@/pages/UnauthorizedPage'
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

// ── Role → dashboard path mapping ────────────────────────────────────────────
const ROLE_DASHBOARD: Record<AppRole, string> = {
  headmaster:         '/dashboard/headmaster',
  deputy_headmaster:  '/dashboard/deputy',
  bursar:             '/dashboard/bursar',
  hod:                '/dashboard/hod',
  class_teacher:      '/dashboard/teacher',
  teacher:            '/dashboard/teacher',
  non_teaching_staff: '/dashboard/staff',
  parent:             '/dashboard/parent',
  student:            '/dashboard/student',
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
        <Suspense fallback={<PageLoader />}>
          <Routes>

            {/* ── Public routes ── */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

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
                  <Route path="hod"     element={<GeneralDashboard />} />
                  <Route path="teacher" element={<TeacherDashboard />} />
                  <Route path="staff"   element={<GeneralDashboard />} />
                  <Route path="parent"  element={<ParentDashboard />} />
                  <Route path="student" element={<GeneralDashboard />} />
                  <Route path="general" element={<GeneralDashboard />} />
                </Route>

                {/* ── Students ── */}
                <Route
                  element={<ProtectedRoute allowedRoles={['headmaster','deputy_headmaster','hod','class_teacher','teacher','bursar','non_teaching_staff']} />}
                >
                  <Route path="/students" element={<StudentList />} />
                  <Route path="/students/:id" element={<StudentDetail />} />
                </Route>

                {/* ── Academics ── */}
                <Route
                  element={<ProtectedRoute allowedRoles={['headmaster','deputy_headmaster','hod','class_teacher','teacher']} />}
                >
                  <Route path="/academics/*" element={<AcademicsPage />} />
                </Route>

                {/* ── Attendance ── */}
                <Route
                  element={<ProtectedRoute allowedRoles={['headmaster','deputy_headmaster','hod','class_teacher','teacher']} />}
                >
                  <Route path="/attendance/*" element={<AttendancePage />} />
                </Route>

                {/* ── Finance ── */}
                <Route
                  element={<ProtectedRoute allowedRoles={['headmaster','deputy_headmaster','bursar']} />}
                >
                  <Route path="/finance/*" element={<FinancePage />} />
                </Route>

                {/* ── Communication ── */}
                <Route path="/communication/*" element={<CommunicationPage />} />

                {/* ── Staff ── */}
                <Route
                  element={<ProtectedRoute allowedRoles={['headmaster','deputy_headmaster']} />}
                >
                  <Route path="/staff/*" element={<StaffPage />} />
                </Route>

                {/* ── Assets ── */}
                <Route
                  element={<ProtectedRoute allowedRoles={['headmaster','deputy_headmaster','non_teaching_staff']} />}
                >
                  <Route path="/assets/*" element={<AssetsPage />} />
                </Route>

                {/* ── Analytics ── */}
                <Route
                  element={<ProtectedRoute allowedRoles={['headmaster','deputy_headmaster','bursar']} />}
                >
                  <Route path="/analytics/*" element={<AnalyticsPage />} />
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
            <Route path="*"  element={<Navigate to="/dashboard" replace />} />

          </Routes>
        </Suspense>
      </BrowserRouter>
      </AuthProvider>

      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  )
}
