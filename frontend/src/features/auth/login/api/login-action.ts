'use server'

import { redirect } from 'next/navigation'
import { backendFetch, ApiError } from '@/shared/api'
import { setSession } from '@/shared/lib'
import { loginSchema } from '../model/login'
import type { AuthResponse } from '@/shared/api'

export type LoginState = {
  fieldErrors: Partial<Record<'email' | 'password', string[]>>
  formError: string | null
}

const initialState: LoginState = { fieldErrors: {}, formError: null }

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      formError: null,
    }
  }

  try {
    const data = await backendFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    })
    await setSession(data)
  } catch (err) {
    if (err instanceof ApiError) {
      const msg =
        err.status === 401 ? 'Invalid email or password' : `Server error: ${err.message}`
      return { ...initialState, formError: msg }
    }
    return { ...initialState, formError: 'Something went wrong. Please try again.' }
  }

  redirect('/dashboard')
}
