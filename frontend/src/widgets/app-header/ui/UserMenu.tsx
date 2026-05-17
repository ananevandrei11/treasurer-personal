import Link from 'next/link'
import { UserIcon } from 'lucide-react'
import { buttonVariants } from '@/shared/ui'

type Props = { email: string }

export function UserMenu({ email }: Props) {
  return (
    <Link href="/profile" className={buttonVariants({ variant: 'ghost', size: 'icon' })} aria-label={email}>
      <UserIcon className="size-4" />
    </Link>
  )
}
