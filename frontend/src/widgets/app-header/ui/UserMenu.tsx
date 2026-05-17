'use client'

import { UserIcon, LogOutIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/shared/ui'
import { Button } from '@/shared/ui'
import { logoutAction } from '@/features/auth/logout'

type Props = { email: string }

export function UserMenu({ email }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label="User menu" />}
      >
        <UserIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="font-normal">
          <span className="text-xs text-muted-foreground truncate max-w-[200px] block">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logoutAction()}
          className="cursor-pointer"
        >
          <LogOutIcon className="mr-2 size-4" />
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
