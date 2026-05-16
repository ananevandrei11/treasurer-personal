import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Enter a valid email'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type RegisterSchema = z.infer<typeof registerSchema>
