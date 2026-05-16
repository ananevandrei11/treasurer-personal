'use server'

import { cookies } from 'next/headers'

const ACCESS_TOKEN = 'accessToken'
const REFRESH_TOKEN = 'refreshToken'

const IS_PROD = process.env.NODE_ENV === 'production'

export async function setSession(tokens: { accessToken: string; refreshToken: string }) {
  const store = await cookies()
  store.set(ACCESS_TOKEN, tokens.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    path: '/',
    maxAge: 60 * 15,
  })
  store.set(REFRESH_TOKEN, tokens.refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function clearSession() {
  const store = await cookies()
  store.delete(ACCESS_TOKEN)
  store.delete(REFRESH_TOKEN)
}

export async function getAccessToken(): Promise<string | undefined> {
  const store = await cookies()
  return store.get(ACCESS_TOKEN)?.value
}
