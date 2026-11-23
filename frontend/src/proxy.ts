import { NextResponse, type NextRequest } from 'next/server'
import { API_URL, ACCESS_TOKEN, REFRESH_TOKEN } from '@/shared/config'

const IS_PROD = process.env.NODE_ENV === 'production'

const ACCESS_MAX_AGE = 60 * 15
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7
const EXP_SKEW_SECONDS = 10

const PUBLIC_PATHS = new Set(['/auth/login', '/auth/register'])

const cookieOptions = (maxAge: number) =>
  ({
    httpOnly: true,
    sameSite: 'strict',
    secure: IS_PROD,
    path: '/',
    maxAge,
  }) as const

type Tokens = { accessToken: string; refreshToken: string }

function getJwtExp(token: string): number | null {
  const part = token.split('.')[1]
  if (!part) return null
  try {
    const payload = JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as {
      exp?: unknown
    }
    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

function isFresh(token: string | undefined): boolean {
  if (!token) return false
  const exp = getJwtExp(token)
  if (exp == null) return false
  return exp * 1000 > Date.now() + EXP_SKEW_SECONDS * 1000
}

function redirectToLogin(request: NextRequest, clearRefresh: boolean) {
  const res = NextResponse.redirect(new URL('/auth/login', request.url))
  res.cookies.delete(ACCESS_TOKEN)
  if (clearRefresh) res.cookies.delete(REFRESH_TOKEN)
  return res
}

export async function proxy(request: NextRequest) {
  if (PUBLIC_PATHS.has(request.nextUrl.pathname)) return NextResponse.next()

  const accessToken = request.cookies.get(ACCESS_TOKEN)?.value
  if (isFresh(accessToken)) return NextResponse.next()

  const refreshToken = request.cookies.get(REFRESH_TOKEN)?.value
  if (!refreshToken) return redirectToLogin(request, false)

  let tokens: Tokens | null = null
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshToken}` },
      cache: 'no-store',
    })
    if (res.ok) tokens = (await res.json()) as Tokens
  } catch {
    // network error - fall through to login redirect
  }

  if (!tokens) return redirectToLogin(request, true)

  // expose fresh tokens to downstream RSC via the request cookies jar
  request.cookies.set(ACCESS_TOKEN, tokens.accessToken)
  request.cookies.set(REFRESH_TOKEN, tokens.refreshToken)

  const response = NextResponse.next({ request: { headers: request.headers } })
  response.cookies.set(ACCESS_TOKEN, tokens.accessToken, cookieOptions(ACCESS_MAX_AGE))
  response.cookies.set(REFRESH_TOKEN, tokens.refreshToken, cookieOptions(REFRESH_MAX_AGE))
  return response
}

export const config = {
  matcher: ['/((?!_next|api|favicon\\.ico|.*\\..*).*)'],
}
