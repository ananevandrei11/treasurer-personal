'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import {
  Alert, AlertDescription,
  Button,
  Field, FieldError, FieldGroup, FieldLabel,
  Input,
} from '@/shared/ui'
import type { Category } from '@/shared/api'
import { createTransactionAction, type CreateTransactionState } from '../api/create-transaction-action'

type Props = {
  categories: Category[]
  onSuccess?: () => void
}

const initialState: CreateTransactionState = { fieldErrors: {}, formError: null, success: false }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Saving…' : 'Add'}
    </Button>
  )
}

export function CreateTransactionForm({ categories, onSuccess }: Props) {
  const [state, action] = useActionState(createTransactionAction, initialState)

  useEffect(() => {
    if (state.success) onSuccess?.()
  }, [state.success, onSuccess])

  const err = (field: keyof CreateTransactionState['fieldErrors']) =>
    state.fieldErrors[field]?.[0]

  return (
    <form action={action} className="flex flex-col gap-4 p-4">
      {state.formError && (
        <Alert variant="destructive">
          <AlertDescription>{state.formError}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <Field>
          <FieldLabel>Type</FieldLabel>
          <div className="flex gap-3 pt-1">
            {(['EXPENSE', 'INCOME'] as const).map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" name="type" value={type} defaultChecked={type === 'EXPENSE'} />
                {type === 'INCOME' ? 'Income' : 'Expense'}
              </label>
            ))}
          </div>
          <FieldError>{err('type')}</FieldError>
        </Field>

        <Field data-invalid={!!err('amount')}>
          <FieldLabel htmlFor="amount">Amount</FieldLabel>
          <Input
            id="amount"
            name="amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            aria-invalid={!!err('amount') || undefined}
          />
          <FieldError>{err('amount')}</FieldError>
        </Field>

        <Field data-invalid={!!err('categoryId')}>
          <FieldLabel htmlFor="categoryId">Category</FieldLabel>
          <select
            id="categoryId"
            name="categoryId"
            className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          <FieldError>{err('categoryId')}</FieldError>
        </Field>

        <Field data-invalid={!!err('date')}>
          <FieldLabel htmlFor="date">Date</FieldLabel>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            aria-invalid={!!err('date') || undefined}
          />
          <FieldError>{err('date')}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="description">Description (optional)</FieldLabel>
          <Input
            id="description"
            name="description"
            type="text"
            placeholder="e.g. lunch at cafe"
          />
        </Field>
      </FieldGroup>

      <SubmitButton />
    </form>
  )
}
