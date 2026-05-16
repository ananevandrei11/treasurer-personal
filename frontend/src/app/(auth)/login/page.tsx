import type { Metadata } from 'next'
import { LoginView } from '@/views/login'

export const metadata: Metadata = { title: 'Sign in — Treasurer' }

export default function LoginPage() {
  return <LoginView />
}
