import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import type { Request } from 'express'
import { TransactionsService } from './transactions.service'
import { CreateTransactionDto } from './dto/create-transaction.dto'
import { UpdateTransactionDto } from './dto/update-transaction.dto'
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto'
import { TransactionDto } from './dto/transaction.dto'
import { ListTransactionsDto } from './dto/list-transactions.dto'

interface JwtUser {
  userId: string
  email: string
}

/**
 * REST controller for the /transactions resource.
 * All routes are protected by the JWT access token guard.
 */
@UseGuards(AuthGuard('jwt'))
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * Returns a paginated list of transactions for the authenticated user.
   *
   * @param req - Express request; `req.user` is populated by the JWT guard.
   * @param query - Optional filters: month (1–12), year (1970–2100), page, limit (1–100).
   * @returns Paginated transaction list with aggregate income/expense summary.
   */
  @Get()
  findAll(@Req() req: Request, @Query() query: ListTransactionsQueryDto): Promise<ListTransactionsDto> {
    const { userId } = req.user as JwtUser
    return this.transactionsService.findAll(userId, query.month, query.year, query.page ?? 1, query.limit ?? 10)
  }

  /**
   * Creates a new transaction for the authenticated user.
   *
   * @param req - Express request with JWT user payload.
   * @param dto - Transaction payload: amount, type, date, categoryId, optional description.
   * @returns The newly created transaction serialized as a DTO.
   * @throws {NotFoundException} If the specified category does not belong to the user.
   */
  @Post()
  async create(@Req() req: Request, @Body() dto: CreateTransactionDto): Promise<TransactionDto> {
    const { userId } = req.user as JwtUser
    const transaction = await this.transactionsService.create(userId, dto)
    return TransactionDto.fromEntity(transaction)
  }

  /**
   * Returns a single transaction by ID for the authenticated user.
   *
   * @param req - Express request with JWT user payload.
   * @param id - Transaction UUID.
   * @returns The transaction DTO.
   * @throws {NotFoundException} If the transaction does not exist or belongs to another user.
   */
  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string): Promise<TransactionDto> {
    const { userId } = req.user as JwtUser
    const transaction = await this.transactionsService.findOne(id, userId)
    if (!transaction) throw new NotFoundException()
    return TransactionDto.fromEntity(transaction)
  }

  /**
   * Partially updates a transaction owned by the authenticated user.
   *
   * @param req - Express request with JWT user payload.
   * @param id - Transaction UUID.
   * @param dto - Fields to update (all optional).
   * @returns The updated transaction DTO.
   * @throws {NotFoundException} If the transaction or the new category is not found.
   */
  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ): Promise<TransactionDto> {
    const { userId } = req.user as JwtUser
    const transaction = await this.transactionsService.update(id, userId, dto)
    return TransactionDto.fromEntity(transaction)
  }

  /**
   * Deletes a transaction owned by the authenticated user.
   *
   * @param req - Express request with JWT user payload.
   * @param id - Transaction UUID.
   * @returns void — HTTP 204 No Content.
   * @throws {NotFoundException} If the transaction does not exist or belongs to another user.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: Request, @Param('id') id: string): Promise<void> {
    const { userId } = req.user as JwtUser
    await this.transactionsService.remove(id, userId)
  }
}
