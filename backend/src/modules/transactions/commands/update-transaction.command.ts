import type { TransactionType } from '@prisma/client'

export class UpdateTransactionCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly amount?: string,
    public readonly type?: TransactionType,
    public readonly date?: Date,
    public readonly categoryId?: string,
    public readonly description?: string,
  ) {}
}
