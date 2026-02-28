import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      {/* Left panel — branding */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-linear-to-br from-slate-900 to-slate-800 p-12">
        {/* Abstract shield watermark */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          aria-hidden
        >
          <svg
            viewBox="0 0 200 200"
            className="absolute -left-12 -top-12 h-80 w-80"
            fill="currentColor"
          >
            <path d="M100 20 L180 60 L180 100 Q180 160 100 180 Q20 160 20 100 L20 60 Z" />
          </svg>
          <svg
            viewBox="0 0 200 200"
            className="absolute -right-24 top-1/3 h-96 w-96"
            fill="currentColor"
          >
            <path d="M100 20 L180 60 L180 100 Q180 160 100 180 Q20 160 20 100 L20 60 Z" />
          </svg>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
            <span className="text-sm font-bold text-white">E</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Educore
          </span>
        </div>

        <div className="relative space-y-4">
          <blockquote className="text-lg font-semibold leading-relaxed text-white tracking-tight">
            &ldquo;Empowering schools with smarter management, one record at a time.&rdquo;
          </blockquote>
          <p className="text-sm font-medium text-slate-300">
            Integrated School Management System
          </p>
        </div>

        <div className="relative flex items-center gap-2">
          <div className="h-1 w-8 rounded-full bg-emerald-500" />
          <div className="h-1 w-4 rounded-full bg-slate-500/40" />
          <div className="h-1 w-4 rounded-full bg-slate-500/40" />
        </div>
      </div>

      {/* Right panel — form (soft grey) */}
      <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 px-6 py-12 lg:px-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
              <span className="text-sm font-bold text-white">E</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Educore</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
