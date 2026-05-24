'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeftRightIcon, TagIcon } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/shared/ui'
import { UserMenu } from './UserMenu'

const navItems = [
  { href: '/', label: 'Transactions', icon: ArrowLeftRightIcon },
  { href: '/categories', label: 'Categories', icon: TagIcon },
]

type Props = { email: string }

export function AppSidebar({ email }: Props) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="px-4 py-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex size-8 items-center justify-center rounded-xl bg-foreground text-background text-sm font-extrabold transition-transform group-hover:scale-95">
            T
          </div>
          <span className="text-[15px] font-bold tracking-tight">Treasurer</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="px-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton
                isActive={pathname === href}
                render={<Link href={href} />}
                size="default"
              >
                <Icon />
                <span>{label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <UserMenu email={email} />
      </SidebarFooter>
    </Sidebar>
  )
}
