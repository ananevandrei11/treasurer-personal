'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/lib/class-names'

const links = [
  { href: '/', label: 'Транзакции' },
  { href: '/categories', label: 'Категории' },
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
