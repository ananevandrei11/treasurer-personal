import { API_URL } from '@/shared/config'

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
