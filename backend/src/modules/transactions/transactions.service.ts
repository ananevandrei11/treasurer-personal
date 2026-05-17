import { Injectable } from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import type { Transaction } from '@prisma/client'
import { CreateTransactionCommand } from './commands/create-transaction.command'
import { UpdateTransactionCommand } from './commands/update-transaction.command'
import { DeleteTransactionCommand } from './commands/delete-transaction.command'
import { GetTransactionsByUserQuery } from './queries/get-transactions-by-user.query'
import { GetTransactionByIdForUserQuery } from './queries/get-transaction-by-id-for-user.query'
import { CreateTransactionDto } from './dto/create-transaction.dto'
import { UpdateTransactionDto } from './dto/update-transaction.dto'
import { ListTransactionsDto } from './dto/list-transactions.dto'

@Injectable()
export class TransactionsService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  findAll(userId: string, month?: number, year?: number): Promise<ListTransactionsDto> {
    return this.queryBus.execute(new GetTransactionsByUserQuery(userId, month, year))
  }

  findOne(id: string, userId: string): Promise<Transaction | null> {
    return this.queryBus.execute(new GetTransactionByIdForUserQuery(id, userId))
  }

  create(userId: string, dto: CreateTransactionDto): Promise<Transaction> {
    return this.commandBus.execute(
      new CreateTransactionCommand(
        userId,
        dto.amount,
        dto.type,
        new Date(dto.date),
        dto.categoryId,
        dto.description,
      ),
    )
  }

  update(id: string, userId: string, dto: UpdateTransactionDto): Promise<Transaction> {
    return this.commandBus.execute(
      new UpdateTransactionCommand(
        id,
        userId,
        dto.amount,
        dto.type,
        dto.date ? new Date(dto.date) : undefined,
        dto.categoryId,
        dto.description,
      ),
    )
  }

  remove(id: string, userId: string): Promise<void> {
    return this.commandBus.execute(new DeleteTransactionCommand(id, userId))
  }
}
