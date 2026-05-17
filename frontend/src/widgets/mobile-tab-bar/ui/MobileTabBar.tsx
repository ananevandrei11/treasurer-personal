'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeftRightIcon, TagIcon, UserIcon } from 'lucide-react'
import { cn } from '@/shared/lib/class-names'

const tabs = [
  { href: '/', label: 'Транзакции', Icon: ArrowLeftRightIcon },
  { href: '/categories', label: 'Категории', Icon: TagIcon },
  { href: '/profile', label: 'Профиль', Icon: UserIcon },
]

export function MobileTabBar() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background md:hidden">
      <div className="flex h-16 items-center justify-around px-4">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors',
                active ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              <Icon className={cn('size-5', active && 'stroke-[2.5]')} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
