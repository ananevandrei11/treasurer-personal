import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const store = await cookies()
  store.delete('accessToken')
  store.delete('refreshToken')
  return NextResponse.redirect(new URL('/login', request.url))
}
