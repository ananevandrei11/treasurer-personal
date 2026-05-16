import type { Metadata } from 'next'
import { RegisterView } from '@/views/register'

export const metadata: Metadata = { title: 'Sign up — Treasurer' }

export default function RegisterPage() {
  return <RegisterView />
}
