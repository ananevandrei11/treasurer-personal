import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common'
import { TransactionsService } from './transactions.service'

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findAll() {
    return this.transactionsService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id)
  }

  @Post()
  create(@Body() _dto: unknown) {
    return this.transactionsService.create(_dto)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() _dto: unknown) {
    return this.transactionsService.update(id, _dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transactionsService.remove(id)
  }
}
