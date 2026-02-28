import { useAuth } from '@/hooks/useAuth'

export function GeneralDashboard() {
  const { profile, role } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome, {profile?.full_name ?? 'User'}
        </h1>
        <p className="text-sm text-muted-foreground capitalize">
          {role?.replace(/_/g, ' ')} portal
        </p>
      </div>
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Your dashboard is being built — Phase 6
        </p>
      </div>
    </div>
  )
}
