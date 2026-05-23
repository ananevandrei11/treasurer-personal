import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { GetTransactionsByUserHandler } from './get-transactions-by-user.handler'
import { GetTransactionsByUserQuery } from '../get-transactions-by-user.query'
import { TransactionRepository } from '../../repositories/transaction.repository'

const makeTransaction = (overrides: Partial<{
  id: string
  amount: Prisma.Decimal
  type: 'INCOME' | 'EXPENSE'
  description: string | null
  date: Date
  categoryId: string
  userId: string
  createdAt: Date
  updatedAt: Date
}> = {}) => ({
  id: 'txn-1',
  amount: new Prisma.Decimal('100.00'),
  type: 'INCOME' as const,
  description: null,
  date: new Date('2026-05-01'),
  categoryId: 'cat-1',
  userId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

describe('GetTransactionsByUserHandler', () => {
  let handler: GetTransactionsByUserHandler
  let repo: jest.Mocked<Pick<TransactionRepository, 'findAllByUser' | 'countByUser' | 'sumByTypeForUser'>>

  beforeEach(async () => {
    repo = {
      findAllByUser: jest.fn(),
      countByUser: jest.fn(),
      sumByTypeForUser: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTransactionsByUserHandler,
        { provide: TransactionRepository, useValue: repo },
      ],
    }).compile()

    handler = module.get(GetTransactionsByUserHandler)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('execute', () => {
    it('should return paginated list with summary when no date filter is provided', async () => {
      const txn = makeTransaction()
      repo.findAllByUser.mockResolvedValue([txn])
      repo.countByUser.mockResolvedValue(1)
      repo.sumByTypeForUser.mockResolvedValue([
        { type: 'INCOME', _sum: { amount: new Prisma.Decimal('100.00') } },
      ])

      const query = new GetTransactionsByUserQuery('user-1', undefined, undefined, 1, 10)
      const result = await handler.execute(query)

      expect(result.transactions).toHaveLength(1)
      expect(result.transactions[0].id).toBe('txn-1')
      expect(result.summary.totalIncome).toBe('100.00')
      expect(result.summary.totalExpense).toBe('0.00')
      expect(result.summary.balance).toBe('100.00')
      expect(result.summary.count).toBe(1)
      expect(result.pagination).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 })
    })

    it('should compute date range and pass it to repo when month and year are provided', async () => {
      repo.findAllByUser.mockResolvedValue([])
      repo.countByUser.mockResolvedValue(0)
      repo.sumByTypeForUser.mockResolvedValue([])

      const query = new GetTransactionsByUserQuery('user-1', 5, 2026, 1, 10)
      await handler.execute(query)

      const [, dateFrom, dateTo] = repo.findAllByUser.mock.calls[0]
      expect(dateFrom).toEqual(new Date(2026, 4, 1))
      expect((dateTo as Date).getFullYear()).toBe(2026)
      expect((dateTo as Date).getMonth()).toBe(4)
      expect((dateTo as Date).getDate()).toBe(31)
    })

    it('should calculate totalPages correctly for multi-page results', async () => {
      repo.findAllByUser.mockResolvedValue([])
      repo.countByUser.mockResolvedValue(25)
      repo.sumByTypeForUser.mockResolvedValue([])

      const query = new GetTransactionsByUserQuery('user-1', undefined, undefined, 2, 10)
      const result = await handler.execute(query)

      expect(result.pagination.totalPages).toBe(3)
      expect(result.pagination.page).toBe(2)
    })

    it('should compute balance as income minus expense', async () => {
      repo.findAllByUser.mockResolvedValue([])
      repo.countByUser.mockResolvedValue(0)
      repo.sumByTypeForUser.mockResolvedValue([
        { type: 'INCOME', _sum: { amount: new Prisma.Decimal('300.00') } },
        { type: 'EXPENSE', _sum: { amount: new Prisma.Decimal('120.50') } },
      ])

      const query = new GetTransactionsByUserQuery('user-1', undefined, undefined, 1, 10)
      const result = await handler.execute(query)

      expect(result.summary.totalIncome).toBe('300.00')
      expect(result.summary.totalExpense).toBe('120.50')
      expect(result.summary.balance).toBe('179.50')
    })

    it('should default both sums to zero when no transactions exist', async () => {
      repo.findAllByUser.mockResolvedValue([])
      repo.countByUser.mockResolvedValue(0)
      repo.sumByTypeForUser.mockResolvedValue([])

      const query = new GetTransactionsByUserQuery('user-1', undefined, undefined, 1, 10)
      const result = await handler.execute(query)

      expect(result.summary.totalIncome).toBe('0.00')
      expect(result.summary.totalExpense).toBe('0.00')
      expect(result.summary.balance).toBe('0.00')
    })

    it('should throw BadRequestException when only month is provided', async () => {
      const query = new GetTransactionsByUserQuery('user-1', 5, undefined, 1, 10)

      await expect(handler.execute(query)).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException when only year is provided', async () => {
      const query = new GetTransactionsByUserQuery('user-1', undefined, 2026, 1, 10)

      await expect(handler.execute(query)).rejects.toThrow(BadRequestException)
    })

    it('should pass correct skip offset to findAllByUser for page 3', async () => {
      repo.findAllByUser.mockResolvedValue([])
      repo.countByUser.mockResolvedValue(30)
      repo.sumByTypeForUser.mockResolvedValue([])

      const query = new GetTransactionsByUserQuery('user-1', undefined, undefined, 3, 10)
      await handler.execute(query)

      expect(repo.findAllByUser).toHaveBeenCalledWith(
        'user-1',
        undefined,
        undefined,
        { skip: 20, take: 10 },
      )
    })
  })
})
