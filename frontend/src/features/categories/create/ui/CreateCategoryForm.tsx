'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  Alert, AlertDescription,
  Button,
  Field, FieldError, FieldGroup, FieldLabel,
  Input,
} from '@/shared/ui'
import { createCategoryAction, type CreateCategoryState } from '../api/create-category-action'

type Props = { onSuccess?: () => void }

const initialState: CreateCategoryState = { fieldErrors: {}, formError: null, success: false }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Saving…' : 'Create'}
    </Button>
  )
}

export function CreateCategoryForm({ onSuccess }: Props) {
  const [state, action] = useActionState(createCategoryAction, initialState)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366f1')

  useEffect(() => {
    if (state.success) onSuccess?.()
  }, [state.success, onSuccess])

  const err = (field: keyof CreateCategoryState['fieldErrors']) =>
    state.fieldErrors[field]?.[0]

  return (
    <form action={action} className="flex flex-col gap-4 p-4">
      {state.formError && (
        <Alert variant="destructive">
          <AlertDescription>{state.formError}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <Field data-invalid={!!err('name')}>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="e.g. Food & Drinks"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!err('name') || undefined}
          />
          <FieldError>{err('name')}</FieldError>
        </Field>

        <Field data-invalid={!!err('color')}>
          <FieldLabel htmlFor="color">Color</FieldLabel>
          <input
            id="color"
            name="color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            aria-invalid={!!err('color') || undefined}
            className="h-9 w-full cursor-pointer rounded-lg border border-input bg-background px-1 py-1 outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
          />
          <FieldError>{err('color')}</FieldError>
        </Field>
      </FieldGroup>

      <SubmitButton />
    </form>
  )
}
