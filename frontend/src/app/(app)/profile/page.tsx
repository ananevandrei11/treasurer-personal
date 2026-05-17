import { redirect } from 'next/navigation'
import { getAccessToken } from '@/shared/lib'
import { backendFetch } from '@/shared/api'
import type { User } from '@/shared/api'
import { logoutAction } from '@/features/auth/logout'
import { Button } from '@/shared/ui'

export default async function ProfilePage() {
  const token = await getAccessToken()
  if (!token) redirect('/login')

  const user = await backendFetch<User>('/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-xl font-semibold">Профиль</h1>
      <div className="mt-6 flex flex-col gap-4 rounded-lg border border-border p-4">
        <div>
          <p className="text-xs text-muted-foreground">Email</p>
          <p className="text-sm font-medium">{user.email}</p>
        </div>
        {user.name && (
          <div>
            <p className="text-xs text-muted-foreground">Имя</p>
            <p className="text-sm font-medium">{user.name}</p>
          </div>
        )}
        <form action={logoutAction}>
          <Button type="submit" variant="destructive">Выйти</Button>
        </form>
      </div>
    </div>
  )
}
