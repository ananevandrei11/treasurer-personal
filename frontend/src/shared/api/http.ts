import { redirect } from 'next/navigation'
import { API_URL } from '@/shared/config'
import { getAccessToken } from '@/shared/lib'

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

/**
 * Authenticated backend call. Token freshness and rotation are handled by `src/proxy.ts`
 * before this code runs, so we just attach the cookie. A 401 here means the token was
 * invalidated server-side after the proxy passed — defer cookie cleanup to the route
 * handler since `cookies().delete()` is not allowed from RSC.
 */
export async function fetchWithAuth<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken()

  try {
    return await backendFetch<T>(path, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...init?.headers },
    })
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      redirect('/api/auth/logout')
    }
    throw err
  }
}
