'use server'

import { redirect } from 'next/navigation'
import { backendFetch, ApiError } from '@/shared/api'
import { setSession } from '@/shared/lib'
import { registerSchema } from '../model/register'
import type { AuthResponse } from '@/shared/api'

export type RegisterState = {
  fieldErrors: Partial<Record<'email' | 'name' | 'password' | 'terms', string[]>>
  formError: string | null
}

const initialState: RegisterState = { fieldErrors: {}, formError: null }

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const termsAccepted = formData.get('terms') === 'on'

  const raw = {
    email: formData.get('email'),
    name: formData.get('name'),
    password: formData.get('password'),
  }

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success || !termsAccepted) {
    return {
      fieldErrors: {
        ...parsed.error?.flatten().fieldErrors,
        ...(!termsAccepted && { terms: ['You must accept the terms to continue'] }),
      },
      formError: null,
    }
  }

  try {
    const data = await backendFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    })
    await setSession(data)
  } catch (err) {
    if (err instanceof ApiError) {
      const msg =
        err.status === 409
          ? 'A user with this email already exists'
          : `Server error: ${err.message}`
      return { ...initialState, formError: msg }
    }
    return { ...initialState, formError: 'Something went wrong. Please try again.' }
  }

  redirect('/')
}
