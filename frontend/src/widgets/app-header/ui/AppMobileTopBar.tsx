'use client'

import Link from 'next/link'
import { SidebarTrigger } from '@/shared/ui'

export function AppMobileTopBar() {
  return (
    <header className="md:hidden flex h-14 shrink-0 items-center gap-3 border-b border-border bg-sidebar px-4">
      <SidebarTrigger />
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background text-xs font-extrabold">
          T
        </div>
        <span className="text-sm font-bold tracking-tight">Treasurer</span>
      </Link>
    </header>
  )
}
