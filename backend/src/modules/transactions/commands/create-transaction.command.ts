import type { TransactionType } from '@prisma/client'

export class CreateTransactionCommand {
  constructor(
    public readonly userId: string,
    public readonly amount: string,
    public readonly type: TransactionType,
    public readonly date: Date,
    public readonly categoryId: string,
    public readonly description?: string,
  ) {}
}
