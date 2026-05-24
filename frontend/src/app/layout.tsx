import type { Metadata } from 'next'
import './globals.css'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { cn } from '@/shared/lib'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Treasurer',
  description: 'Personal expense tracker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn('h-full font-sans', jakarta.variable)}>
      <body className="h-full">{children}</body>
    </html>
  )
}
