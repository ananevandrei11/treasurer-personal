'use server'

import { redirect } from 'next/navigation'
import { backendFetch } from '@/shared/api'
import { getAccessToken } from '@/shared/lib'

export async function logoutAction() {
  const token = await getAccessToken()
  if (token) {
    try {
      await backendFetch('/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      // best-effort logout on backend
    }
  }
  redirect('/api/auth/logout')
}
