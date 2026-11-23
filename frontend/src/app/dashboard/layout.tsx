import { fetchWithAuth } from '@/shared/api'
import type { User } from '@/shared/api'
import { AppSidebar, AppMobileTopBar } from '@/widgets/app-header'
import { MobileTabBar } from '@/widgets/mobile-tab-bar'
import { SidebarProvider, SidebarInset } from '@/shared/ui'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await fetchWithAuth<User>('/users/me')

  return (
    <SidebarProvider>
      <AppSidebar email={user.email} />
      <SidebarInset>
        <AppMobileTopBar />
        <div className="flex-1 pb-[60px] md:pb-0">{children}</div>
      </SidebarInset>
      <MobileTabBar />
    </SidebarProvider>
  )
}
