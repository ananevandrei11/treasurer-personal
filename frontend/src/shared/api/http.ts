import { redirect } from 'next/navigation'
import { API_URL } from '@/shared/config'
import { getAccessToken, getRefreshToken, setSession, clearSession } from '@/shared/lib'
import type { TokenPair } from './auth'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function backendFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`
    try {
      const body = (await res.json()) as { message?: string | string[] }
      const raw = body.message
      message = Array.isArray(raw) ? raw.join(', ') : (raw ?? message)
    } catch {
      // use status text as message
    }
    throw new ApiError(res.status, message)
  }

  return res.json() as Promise<T>
}

export async function fetchWithAuth<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken()

  try {
    return await backendFetch<T>(path, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...init?.headers },
    })
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) throw err
  }

  // access token expired — try refresh
  const refreshToken = await getRefreshToken()
  if (refreshToken) {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshToken}` },
      cache: 'no-store',
    })

    if (res.ok) {
      const tokens = (await res.json()) as TokenPair
      await setSession(tokens)
      return backendFetch<T>(path, {
        ...init,
        headers: { Authorization: `Bearer ${tokens.accessToken}`, ...init?.headers },
      })
    }
  }

  await clearSession()
  redirect('/login')
}
