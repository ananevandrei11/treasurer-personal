import { redirect } from 'next/navigation'
import { getAccessToken } from '@/shared/lib'
import { fetchWithAuth } from '@/shared/api'
import type { User } from '@/shared/api'
import { AppHeader } from '@/widgets/app-header'
import { MobileTabBar } from '@/widgets/mobile-tab-bar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const token = await getAccessToken()
  if (!token) redirect('/login')

  let user: User
  try {
    user = await fetchWithAuth<User>('/users/me')
  } catch {
    redirect('/login')
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader email={user.email} />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <MobileTabBar />
    </div>
  )
}
