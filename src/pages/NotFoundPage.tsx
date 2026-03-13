import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card px-6 py-10 text-center shadow-sm sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          404 error
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          Page Not Found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you are looking for does not exist or may have been moved.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Button asChild className="w-full sm:w-auto">
            <Link to="/dashboard" className="flex items-center justify-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </Link>
          </Button>

          <p className="text-xs text-muted-foreground">
            If you believe this is a mistake, please check the URL or use the sidebar to navigate.
          </p>
        </div>
      </div>
    </div>
  )
}

