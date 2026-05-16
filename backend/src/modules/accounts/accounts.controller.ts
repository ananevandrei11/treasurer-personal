import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common'
import { AccountsService } from './accounts.service'

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  findAll() {
    return this.accountsService.findAll()
  }

  @Post()
  create(@Body() _dto: unknown) {
    return this.accountsService.create(_dto)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() _dto: unknown) {
    return this.accountsService.update(id, _dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountsService.remove(id)
  }
}
