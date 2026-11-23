'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/lib'

const links = [
  { href: '/dashboard', label: 'Transactions' },
  { href: '/dashboard/categories', label: 'Categories' },
]

export function AppNavLinks() {
  const pathname = usePathname()
  return (
    <nav className="hidden md:flex items-center gap-1">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            pathname === href
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent',
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
