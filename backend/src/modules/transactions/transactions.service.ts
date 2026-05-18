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

/**
 * Application service for the Transactions domain.
 * Delegates reads to QueryBus and writes to CommandBus.
 */
@Injectable()
export class TransactionsService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Fetches a paginated list of transactions for a user, optionally filtered by month/year.
   *
   * @param userId - Owner user UUID.
   * @param month - Optional calendar month (1–12).
   * @param year - Optional calendar year (1970–2100).
   * @param page - Page number (1-based), defaults to 1.
   * @param limit - Page size, defaults to 10.
   * @returns Paginated transaction list with aggregate summary.
   * @throws {BadRequestException} If only one of `month` or `year` is provided.
   */
  findAll(userId: string, month?: number, year?: number, page = 1, limit = 10): Promise<ListTransactionsDto> {
    return this.queryBus.execute(new GetTransactionsByUserQuery(userId, month, year, page, limit))
  }

  /**
   * Fetches a single transaction by ID, scoped to the given user.
   *
   * @param id - Transaction UUID.
   * @param userId - Owner user UUID.
   * @returns The Prisma Transaction entity, or `null` if not found or not owned by the user.
   */
  findOne(id: string, userId: string): Promise<Transaction | null> {
    return this.queryBus.execute(new GetTransactionByIdForUserQuery(id, userId))
  }

  /**
   * Creates a new transaction for the given user.
   *
   * @param userId - Owner user UUID.
   * @param dto - Validated input DTO.
   * @returns The created Prisma Transaction entity.
   * @throws {NotFoundException} If the specified category does not belong to the user.
   */
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

  /**
   * Updates fields on an existing transaction owned by the user.
   *
   * @param id - Transaction UUID.
   * @param userId - Owner user UUID.
   * @param dto - Partial update DTO (all fields optional).
   * @returns The updated Prisma Transaction entity.
   * @throws {NotFoundException} If the transaction or the new category is not found.
   */
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

  /**
   * Deletes a transaction owned by the user.
   *
   * @param id - Transaction UUID.
   * @param userId - Owner user UUID.
   * @returns void.
   * @throws {NotFoundException} If the transaction does not exist or belongs to another user.
   */
  remove(id: string, userId: string): Promise<void> {
    return this.commandBus.execute(new DeleteTransactionCommand(id, userId))
  }
}
