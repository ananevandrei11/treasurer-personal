'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/lib'

const links = [
  { href: '/', label: 'Transactions' },
  { href: '/categories', label: 'Categories' },
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
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            pathname === href
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
