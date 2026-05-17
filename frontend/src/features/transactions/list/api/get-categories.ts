import { cache } from 'react'
import { backendFetch } from '@/shared/api'
import type { Category } from '@/shared/api'
import { getAccessToken } from '@/shared/lib'

export const getCategories = cache(async function getCategories(): Promise<Category[]> {
  const token = await getAccessToken()
  return backendFetch<Category[]>('/categories', {
    headers: { Authorization: `Bearer ${token}` },
  })
})
