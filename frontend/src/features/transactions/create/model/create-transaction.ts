import { z } from 'zod'

export const createTransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount (e.g. 100 or 100.50)')
    .refine((v) => parseFloat(v) > 0, 'Amount must be greater than zero'),
  categoryId: z.string().uuid('Please select a category'),
  date: z.string().min(1, 'Please enter a date'),
  description: z.string().max(500).optional(),
})

export type CreateTransactionFields = z.infer<typeof createTransactionSchema>
