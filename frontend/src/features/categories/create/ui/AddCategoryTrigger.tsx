'use client'

import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui'
import { CreateCategoryForm } from './CreateCategoryForm'

export function AddCategoryTrigger() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        Add
      </Button>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>New category</SheetTitle>
        </SheetHeader>
        <CreateCategoryForm onSuccess={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
