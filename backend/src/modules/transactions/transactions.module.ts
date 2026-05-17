import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { TransactionsController } from './transactions.controller'
import { TransactionsService } from './transactions.service'
import { TransactionRepository } from './repositories/transaction.repository'
import { CreateTransactionHandler } from './commands/handlers/create-transaction.handler'
import { UpdateTransactionHandler } from './commands/handlers/update-transaction.handler'
import { DeleteTransactionHandler } from './commands/handlers/delete-transaction.handler'
import { GetTransactionsByUserHandler } from './queries/handlers/get-transactions-by-user.handler'
import { GetTransactionByIdForUserHandler } from './queries/handlers/get-transaction-by-id-for-user.handler'
import { CategoriesModule } from '../categories/categories.module'

@Module({
  imports: [CqrsModule, CategoriesModule],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    TransactionRepository,
    CreateTransactionHandler,
    UpdateTransactionHandler,
    DeleteTransactionHandler,
    GetTransactionsByUserHandler,
    GetTransactionByIdForUserHandler,
  ],
})
export class TransactionsModule {}
