import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseBoolPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new category (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Category with this name already exists',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Actors & Actresses' },
        description: { type: 'string', example: 'Famous actors and actresses from movies and TV shows' },
        isActive: { type: 'boolean', example: true },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Category image file',
        },
      },
      required: ['name'],
    },
  })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<CategoryResponseDto> {
    // If image is provided, upload it to Cloudinary
    if (image) {
      const result = await this.cloudinaryService.uploadImage(image, 'who-am-i/categories');
      createCategoryDto.imageUrl = result.url;
    }
    
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Include inactive categories',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    type: [CategoryResponseDto],
  })
  findAll(
    @Query('includeInactive', new ParseBoolPipe({ optional: true })) includeInactive?: boolean,
  ): Promise<CategoryResponseDto[]> {
    return this.categoriesService.findAll(includeInactive);
  }

  @Get('active')
  @Public()
  @ApiOperation({ summary: 'Get all active categories' })
  @ApiResponse({
    status: 200,
    description: 'Active categories retrieved successfully',
    type: [CategoryResponseDto],
  })
  getActiveCategories(): Promise<CategoryResponseDto[]> {
    return this.categoriesService.getActiveCategories();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  findOne(@Param('id') id: string): Promise<CategoryResponseDto> {
    return this.categoriesService.findOne(id);
  }

  @Get(':id/stats')
  @Public()
  @ApiOperation({ summary: 'Get category statistics' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({
    status: 200,
    description: 'Category statistics retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  getCategoryStats(@Param('id') id: string) {
    return this.categoriesService.getCategoryStats(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update category (Admin only)' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Category name already exists',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Actors & Actresses' },
        description: { type: 'string', example: 'Famous actors and actresses from movies and TV shows' },
        isActive: { type: 'boolean', example: true },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Category image file',
        },
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<CategoryResponseDto> {
    // If image is provided, upload it to Cloudinary
    if (image) {
      // Get the current category to check if it has an existing image
      const currentCategory = await this.categoriesService.findOne(id);
      
      // Upload the new image
      const result = await this.cloudinaryService.uploadImage(image, 'who-am-i/categories');
      updateCategoryDto.imageUrl = result.url;
      
      // TODO: Delete old image from Cloudinary if it exists
      // This would require storing the public_id of the image in the database
      // For now, we'll just update with the new image URL
    }
    
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete category (Admin only)' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete category with cards',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.categoriesService.remove(id);
  }

  @Post(':id/upload-image')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Upload category image (Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({
    status: 200,
    description: 'Image uploaded successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async uploadCategoryImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Upload image to Cloudinary
    const result = await this.cloudinaryService.uploadImage(file, 'who-am-i/categories');
    
    // Update category with new image URL
    const category = await this.categoriesService.update(id, {
      imageUrl: result.url,
    });
    
    return {
      success: true,
      imageUrl: result.url,
      category,
    };
  }
}
