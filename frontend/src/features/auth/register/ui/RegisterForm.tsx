'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { Checkbox } from '@/shared/ui'
import { registerAction, type RegisterState } from '../api/register-action'

const initialState: RegisterState = { fieldErrors: {}, formError: null }

const inputCls =
  'w-full rounded-xl border border-input bg-background px-4 py-3.5 text-base text-foreground placeholder:text-muted-foreground outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/30'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3.5 text-base font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Creating account…' : 'Create account'}
    </button>
  )
}

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, initialState)

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card px-10 py-12 shadow-2xl shadow-black/10">
      <div className="mb-8">
        <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          💰 Treasurer
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Create your account</h1>
        <p className="mt-1.5 text-base text-muted-foreground">
          Start managing your finances today
        </p>
      </div>

      <form action={action} noValidate className="flex flex-col gap-5">
        {state.formError && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.formError}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="John Doe"
            aria-invalid={state.fieldErrors.name ? 'true' : undefined}
            className={inputCls}
          />
          {state.fieldErrors.name && (
            <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={state.fieldErrors.email ? 'true' : undefined}
            className={inputCls}
          />
          {state.fieldErrors.email && (
            <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            aria-invalid={state.fieldErrors.password ? 'true' : undefined}
            className={inputCls}
          />
          {state.fieldErrors.password && (
            <p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              name="terms"
              aria-invalid={state.fieldErrors.terms ? true : undefined}
              className="mt-0.5"
            />
            <label
              htmlFor="terms"
              className="text-sm text-muted-foreground leading-snug cursor-pointer"
            >
              I agree to the{' '}
              <Link
                href="/terms"
                className="font-medium text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                className="font-medium text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                Privacy Policy
              </Link>
            </label>
          </div>
          {state.fieldErrors.terms && (
            <p className="text-xs text-destructive">{state.fieldErrors.terms[0]}</p>
          )}
        </div>

        <div className="mt-1">
          <SubmitButton />
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
