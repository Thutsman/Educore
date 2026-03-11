import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { School } from 'lucide-react'
import { useSchool } from '@/context/SchoolContext'
import type { School as SchoolType } from '@/types'

export function SelectSchoolPage() {
  const { schools, currentSchool, setCurrentSchool, isLoading } = useSchool()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && currentSchool) {
      navigate('/dashboard', { replace: true })
    }
  }, [currentSchool, isLoading, navigate])

  function handleSelect(school: SchoolType) {
    setCurrentSchool(school)
    navigate('/dashboard', { replace: true })
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    )
  }

  if (schools.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <School className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold">No Schools Assigned</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account has not been assigned to any school yet. Please contact your administrator.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 shadow-sm">
          <span className="text-lg font-bold text-white">E</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Select a School</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the school you want to manage
        </p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        {schools.map((school) => {
          const initials = school.name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)

          return (
            <button
              key={school.id}
              onClick={() => handleSelect(school)}
              className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 text-center shadow-sm transition-all hover:border-emerald-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-600">
                {school.logo_url ? (
                  <img
                    src={school.logo_url}
                    alt={school.name}
                    className="h-12 w-12 rounded-xl object-contain"
                  />
                ) : (
                  <span className="text-2xl font-bold">{initials}</span>
                )}
              </div>
              <div>
                <p className="font-semibold leading-tight">{school.name}</p>
                {school.slug && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{school.slug}</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
