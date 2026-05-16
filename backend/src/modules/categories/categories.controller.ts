import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import type { Request } from 'express'
import { CategoriesService } from './categories.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import { CategoryDto } from './dto/category.dto'

interface JwtUser {
  userId: string
  email: string
}

@UseGuards(AuthGuard('jwt'))
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(@Req() req: Request): Promise<CategoryDto[]> {
    const { userId } = req.user as JwtUser
    const categories = await this.categoriesService.findAll(userId)
    return categories.map(CategoryDto.fromEntity)
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateCategoryDto): Promise<CategoryDto> {
    const { userId } = req.user as JwtUser
    const category = await this.categoriesService.create(userId, dto.name, dto.color, dto.icon)
    return CategoryDto.fromEntity(category)
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string): Promise<CategoryDto> {
    const { userId } = req.user as JwtUser
    const category = await this.categoriesService.findOne(id, userId)
    if (!category) throw new NotFoundException()
    return CategoryDto.fromEntity(category)
  }

  @Put(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryDto> {
    const { userId } = req.user as JwtUser
    const category = await this.categoriesService.update(id, userId, dto.name, dto.color, dto.icon)
    return CategoryDto.fromEntity(category)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: Request, @Param('id') id: string): Promise<void> {
    const { userId } = req.user as JwtUser
    await this.categoriesService.remove(id, userId)
  }
}
