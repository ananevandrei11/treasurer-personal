'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeftRightIcon, TagIcon, UserIcon } from 'lucide-react'
import { cn } from '@/shared/lib'

const tabs = [
  { href: '/', label: 'Transactions', Icon: ArrowLeftRightIcon },
  { href: '/categories', label: 'Categories', Icon: TagIcon },
  { href: '/profile', label: 'Profile', Icon: UserIcon },
]

export function MobileTabBar() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-sidebar md:hidden">
      <div className="flex h-[60px] items-center justify-around px-2">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors',
                active ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-xl transition-colors',
                  active ? 'bg-muted' : '',
                )}
              >
                <Icon className={cn('size-[18px]', active && 'stroke-[2.5]')} />
              </div>
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
