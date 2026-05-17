'use client'

import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui'
import type { Category } from '@/shared/api'
import { CreateTransactionForm } from './CreateTransactionForm'

type Props = { categories: Category[] }

export function AddTransactionTrigger({ categories }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        Добавить
      </Button>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Новая транзакция</SheetTitle>
        </SheetHeader>
        <CreateTransactionForm
          categories={categories}
          onSuccess={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
