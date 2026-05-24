import { fetchWithAuth } from '@/shared/api'
import type { User } from '@/shared/api'
import { AppHeader } from '@/widgets/app-header'
import { MobileTabBar } from '@/widgets/mobile-tab-bar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await fetchWithAuth<User>('/users/me')

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader email={user.email} />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <MobileTabBar />
    </div>
  )
}
