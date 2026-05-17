'use server'

import { revalidatePath } from 'next/cache'
import { fetchWithAuth, ApiError } from '@/shared/api'
import { createTransactionSchema } from '../model/create-transaction'

export type CreateTransactionState = {
  fieldErrors: Partial<Record<'type' | 'amount' | 'categoryId' | 'date' | 'description', string[]>>
  formError: string | null
  success: boolean
}

const initialState: CreateTransactionState = { fieldErrors: {}, formError: null, success: false }

export async function createTransactionAction(
  _prev: CreateTransactionState,
  formData: FormData,
): Promise<CreateTransactionState> {
  const raw = {
    type: formData.get('type'),
    amount: formData.get('amount'),
    categoryId: formData.get('categoryId'),
    date: formData.get('date'),
    description: formData.get('description') || undefined,
  }

  const parsed = createTransactionSchema.safeParse(raw)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, formError: null, success: false }
  }

  try {
    await fetchWithAuth('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        ...parsed.data,
        date: new Date(parsed.data.date).toISOString(),
      }),
    })
  } catch (err) {
    if (err instanceof ApiError) {
      return { ...initialState, formError: `Server error: ${err.message}` }
    }
    return { ...initialState, formError: 'Something went wrong. Please try again.' }
  }

  revalidatePath('/')
  return { fieldErrors: {}, formError: null, success: true }
}
