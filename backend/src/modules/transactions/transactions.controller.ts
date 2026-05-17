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
import type { Transaction, Prisma } from '@prisma/client'

interface JwtUser {
  userId: string
  email: string
}

@UseGuards(AuthGuard('jwt'))
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findAll(@Req() req: Request, @Query() query: ListTransactionsQueryDto): Promise<ListTransactionsDto> {
    const { userId } = req.user as JwtUser
    return this.transactionsService.findAll(userId, query.month, query.year, query.page ?? 1, query.limit ?? 10)
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateTransactionDto): Promise<TransactionDto> {
    const { userId } = req.user as JwtUser
    const transaction = await this.transactionsService.create(userId, dto)
    return TransactionDto.fromEntity(transaction as Transaction & { amount: Prisma.Decimal })
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string): Promise<TransactionDto> {
    const { userId } = req.user as JwtUser
    const transaction = await this.transactionsService.findOne(id, userId)
    if (!transaction) throw new NotFoundException()
    return TransactionDto.fromEntity(transaction as Transaction & { amount: Prisma.Decimal })
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ): Promise<TransactionDto> {
    const { userId } = req.user as JwtUser
    const transaction = await this.transactionsService.update(id, userId, dto)
    return TransactionDto.fromEntity(transaction as Transaction & { amount: Prisma.Decimal })
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: Request, @Param('id') id: string): Promise<void> {
    const { userId } = req.user as JwtUser
    await this.transactionsService.remove(id, userId)
  }
}
