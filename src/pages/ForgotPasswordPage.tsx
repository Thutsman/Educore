import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, MailCheck } from 'lucide-react'
import { supabase, getPasswordResetRedirectToAttempts } from '@/lib/supabase'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})

type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    let lastMessage = 'Could not send reset email.'
    for (const redirectTo of getPasswordResetRedirectToAttempts()) {
      const { error } = await supabase.auth.resetPasswordForEmail(
        data.email,
        redirectTo ? { redirectTo } : {},
      )
      if (!error) {
        setSent(true)
        return
      }
      lastMessage = error.message || lastMessage
    }
    setServerError(lastMessage)
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <MailCheck className="h-7 w-7 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Check your inbox</h1>
          <p className="text-sm text-muted-foreground">
            We sent a password reset link to{' '}
            <span className="font-medium text-foreground">{getValues('email')}</span>.
            The link expires in 1 hour.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Didn't receive an email? Check your spam folder or{' '}
          <button
            type="button"
            onClick={() => setSent(false)}
            className="text-primary hover:underline"
          >
            try again
          </button>
          .
        </p>
        <Link
          to="/login"
          className="block text-sm text-primary hover:underline"
        >
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Forgot password?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@school.ac.zw"
            {...register('email')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {serverError && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Send reset link'
          )}
        </button>
      </form>

      <Link
        to="/login"
        className="block text-center text-sm text-primary hover:underline"
      >
        Back to login
      </Link>
    </div>
  )
}
