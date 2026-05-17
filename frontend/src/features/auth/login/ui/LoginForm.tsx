'use client'

import { useActionState, useState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import {
  Alert, AlertDescription,
  Button,
  Card, CardContent, CardHeader,
  Field, FieldError, FieldGroup, FieldLabel,
  Input,
} from '@/shared/ui'
import { loginAction, type LoginState } from '../api/login-action'

const initialState: LoginState = { fieldErrors: {}, formError: null }

type FieldKey = keyof LoginState['fieldErrors']

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} size="lg">
      {pending ? 'Signing in…' : 'Sign in'}
    </Button>
  )
}

export function LoginForm() {
  const [state, action] = useActionState(loginAction, initialState)
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
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground">Sign in to your account</p>
      </CardHeader>

      <CardContent>
        <form action={action} noValidate className="flex flex-col gap-5">
          {state.formError && (
            <Alert variant="destructive">
              <AlertDescription>{state.formError}</AlertDescription>
            </Alert>
          )}

          <FieldGroup>
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
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={hasError('password') || undefined}
                onChange={() => markDirty('password')}
              />
              <FieldError>{errorMsg('password')}</FieldError>
            </Field>
          </FieldGroup>

          <SubmitButton />

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
            >
              Create One
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
