import { useNavigate } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'

export function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <ShieldOff className="h-8 w-8 text-destructive" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You don't have permission to view this page.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
        >
          Go Back
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Dashboard
        </button>
      </div>
    </div>
  )
}
