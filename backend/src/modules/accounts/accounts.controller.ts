import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { AccountsService } from './accounts.service'

@UseGuards(AuthGuard('jwt'))
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
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.accountsService.remove(id)
  }
}
