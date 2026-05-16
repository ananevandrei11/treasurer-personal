import { Injectable } from '@nestjs/common'

@Injectable()
export class TransactionsService {
  findAll(): Promise<unknown[]> {
    throw new Error('Not implemented')
  }

  findOne(_id: string): Promise<unknown> {
    throw new Error('Not implemented')
  }

  create(_dto: unknown): Promise<unknown> {
    throw new Error('Not implemented')
  }

  update(_id: string, _dto: unknown): Promise<unknown> {
    throw new Error('Not implemented')
  }

  remove(_id: string): Promise<void> {
    throw new Error('Not implemented')
  }
}
