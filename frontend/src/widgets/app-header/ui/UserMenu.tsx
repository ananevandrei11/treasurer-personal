'use client'

import Link from 'next/link'
import { SidebarMenuButton } from '@/shared/ui'

type Props = { email: string }

export function UserMenu({ email }: Props) {
  const initial = email[0]?.toUpperCase() ?? '?'
  return (
    <SidebarMenuButton size="lg" render={<Link href="/dashboard/profile" aria-label={`Profile: ${email}`} />}>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold uppercase">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{email}</p>
      </div>
    </SidebarMenuButton>
  )
}
