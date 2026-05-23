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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import { CategoriesService } from './categories.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import { CategoryDto } from './dto/category.dto'

interface JwtUser {
  userId: string
  email: string
}

/**
 * REST controller for the /categories resource.
 * All routes are protected by the JWT access token guard.
 */
@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Returns all categories for the authenticated user.
   *
   * @param req - Express request; `req.user` is populated by the JWT guard.
   * @returns Array of category DTOs.
   */
  @ApiOperation({ summary: 'List categories' })
  @ApiResponse({ status: 200, description: 'List of categories.', type: [CategoryDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @Get()
  async findAll(@Req() req: Request): Promise<CategoryDto[]> {
    const { userId } = req.user as JwtUser
    const categories = await this.categoriesService.findAll(userId)
    return categories.map(CategoryDto.fromEntity)
  }

  /**
   * Creates a new category for the authenticated user.
   *
   * @param req - Express request with JWT user payload.
   * @param dto - Category payload: name, color, icon.
   * @returns The newly created category DTO.
   */
  @ApiOperation({ summary: 'Create category' })
  @ApiResponse({ status: 201, description: 'Category created successfully.', type: CategoryDto })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @Post()
  async create(@Req() req: Request, @Body() dto: CreateCategoryDto): Promise<CategoryDto> {
    const { userId } = req.user as JwtUser
    const category = await this.categoriesService.create(userId, dto.name, dto.color, dto.icon)
    return CategoryDto.fromEntity(category)
  }

  /**
   * Returns a single category by ID for the authenticated user.
   *
   * @param req - Express request with JWT user payload.
   * @param id - Category UUID.
   * @returns The category DTO.
   * @throws {NotFoundException} If the category does not exist or belongs to another user.
   */
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category found.', type: CategoryDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @Get(':id')
  async findOne(@Req() req: Request, @Param('id') id: string): Promise<CategoryDto> {
    const { userId } = req.user as JwtUser
    const category = await this.categoriesService.findOne(id, userId)
    if (!category) throw new NotFoundException()
    return CategoryDto.fromEntity(category)
  }

  /**
   * Updates a category owned by the authenticated user.
   *
   * @param req - Express request with JWT user payload.
   * @param id - Category UUID.
   * @param dto - Fields to update.
   * @returns The updated category DTO.
   * @throws {NotFoundException} If the category is not found.
   */
  @ApiOperation({ summary: 'Update category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category updated.', type: CategoryDto })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
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

  /**
   * Deletes a category owned by the authenticated user.
   *
   * @param req - Express request with JWT user payload.
   * @param id - Category UUID.
   * @returns void — HTTP 204 No Content.
   * @throws {NotFoundException} If the category does not exist or belongs to another user.
   * @throws {ConflictException} If the category has associated transactions (handled in command handler).
   */
  @ApiOperation({ summary: 'Delete category' })
  @ApiParam({ name: 'id', description: 'Category UUID' })
  @ApiResponse({ status: 204, description: 'Category deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @ApiResponse({ status: 409, description: 'Category has transactions and cannot be deleted.' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: Request, @Param('id') id: string): Promise<void> {
    const { userId } = req.user as JwtUser
    await this.categoriesService.remove(id, userId)
  }
}
