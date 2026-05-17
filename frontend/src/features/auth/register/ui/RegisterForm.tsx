'use client'

import { useActionState, useState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import {
  Alert, AlertDescription,
  Button,
  Card, CardContent, CardHeader,
  Checkbox,
  Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel,
  Input,
} from '@/shared/ui'
import { registerAction, type RegisterState } from '../api/register-action'

const initialState: RegisterState = { fieldErrors: {}, formError: null }

type FieldKey = keyof RegisterState['fieldErrors']

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} size="lg">
      {pending ? 'Creating account…' : 'Create account'}
    </Button>
  )
}

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, initialState)
  const [dirtyFields, setDirtyFields] = useState<Set<FieldKey>>(new Set())

  useEffect(() => {
    setDirtyFields(new Set())
  }, [state])

  const markDirty = (field: FieldKey) =>
    setDirtyFields((prev) => new Set([...prev, field]))

  const hasError = (field: FieldKey) =>
    !dirtyFields.has(field) && !!state.fieldErrors[field]

  const errorMsg = (field: FieldKey) =>
    dirtyFields.has(field) ? undefined : state.fieldErrors[field]?.[0]

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          💰 Treasurer
        </span>
        <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
        <p className="text-muted-foreground">Start managing your finances today</p>
      </CardHeader>

      <CardContent>
        <form action={action} noValidate className="flex flex-col gap-5">
          {state.formError && (
            <Alert variant="destructive">
              <AlertDescription>{state.formError}</AlertDescription>
            </Alert>
          )}

          <FieldGroup>
            <Field data-invalid={hasError('name')}>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                aria-invalid={hasError('name') || undefined}
                onChange={() => markDirty('name')}
              />
              <FieldError>{errorMsg('name')}</FieldError>
            </Field>

            <Field data-invalid={hasError('email')}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={hasError('email') || undefined}
                onChange={() => markDirty('email')}
              />
              <FieldError>{errorMsg('email')}</FieldError>
            </Field>

            <Field data-invalid={hasError('password')}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                aria-invalid={hasError('password') || undefined}
                onChange={() => markDirty('password')}
              />
              <FieldError>{errorMsg('password')}</FieldError>
            </Field>

            <Field data-invalid={hasError('terms')}>
              <FieldLabel htmlFor="terms">
                <Checkbox
                  id="terms"
                  name="terms"
                  aria-invalid={hasError('terms') || undefined}
                  onCheckedChange={() => markDirty('terms')}
                />
                <FieldContent>
                  <FieldDescription>
                    I agree to the{' '}
                    <Link href="/terms" onClick={(e) => e.stopPropagation()}>
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" onClick={(e) => e.stopPropagation()}>
                      Privacy Policy
                    </Link>
                  </FieldDescription>
                </FieldContent>
              </FieldLabel>
              <FieldError>{errorMsg('terms')}</FieldError>
            </Field>
          </FieldGroup>

          <SubmitButton />

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
            >
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
