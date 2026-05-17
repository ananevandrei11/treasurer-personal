import { z } from 'zod'

export const createTransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Введите корректную сумму (например: 100 или 100.50)'),
  categoryId: z.string().uuid('Выберите категорию'),
  date: z.string().min(1, 'Укажите дату'),
  description: z.string().max(500).optional(),
})

export type CreateTransactionFields = z.infer<typeof createTransactionSchema>
