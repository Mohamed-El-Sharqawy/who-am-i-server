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
  ParseIntPipe,
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
import { CardsService } from './cards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { CardResponseDto } from './dto/card-response.dto';
import { GetRandomCardsDto } from './dto/get-random-cards.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/pagination.interface';

@ApiTags('Cards')
@Controller('cards')
export class CardsController {
  constructor(
    private readonly cardsService: CardsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new card (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Card created successfully',
    type: CardResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Brad Pitt' },
        description: { type: 'string', example: 'American actor and film producer' },
        categoryId: { type: 'string', example: 'clq1234567890' },
        difficulty: { type: 'string', enum: ['EASY', 'MEDIUM', 'HARD'], example: 'MEDIUM' },
        hints: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['Born in Oklahoma', 'Won an Oscar for Once Upon a Time in Hollywood']
        },
        isActive: { type: 'boolean', example: true },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Card image file',
        },
      },
      required: ['name', 'categoryId'],
    },
  })
  async create(
    @Body() createCardDto: CreateCardDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<CardResponseDto> {
    // If image is provided, upload it to Cloudinary
    if (image) {
      const result = await this.cloudinaryService.uploadImage(image, 'who-am-i/cards');
      createCardDto.imageUrl = result.url;
    }
    
    return this.cardsService.create(createCardDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all cards with pagination' })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Include inactive cards',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Cards retrieved successfully',
    schema: {
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/CardResponseDto' },
        },
        meta: {
          type: 'object',
          properties: {
            currentPage: { type: 'number' },
            pagesCount: { type: 'number' },
            totalCount: { type: 'number' },
            limit: { type: 'number' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' },
          },
        },
      },
    },
  })
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('includeInactive', new ParseBoolPipe({ optional: true })) includeInactive?: boolean,
    @Query() paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<CardResponseDto>> {
    const { page = 1, limit = 20 } = paginationDto || {};
    return this.cardsService.findAll(categoryId, includeInactive, page, limit);
  }

  @Get('random')
  @Public()
  @ApiOperation({ 
    summary: 'Get random cards',
    description: 'Retrieve random cards based on specified criteria. Perfect for game sessions.'
  })
  @ApiQuery({
    name: 'count',
    required: false,
    type: Number,
    description: 'Number of cards to retrieve (1-50, default: 5)',
  })
  @ApiQuery({
    name: 'categoryIds',
    required: false,
    type: [String],
    description: 'Array of category IDs to filter by',
  })
  @ApiQuery({
    name: 'minDifficulty',
    required: false,
    type: Number,
    description: 'Minimum difficulty level (1-5)',
  })
  @ApiQuery({
    name: 'maxDifficulty',
    required: false,
    type: Number,
    description: 'Maximum difficulty level (1-5)',
  })
  @ApiResponse({
    status: 200,
    description: 'Random cards retrieved successfully',
    type: [CardResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid parameters',
  })
  getRandomCards(@Query() params: GetRandomCardsDto): Promise<CardResponseDto[]> {
    return this.cardsService.getRandomCards(params);
  }

  @Get('category/:categoryId')
  @Public()
  @ApiOperation({ summary: 'Get cards by category' })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Include inactive cards',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Cards retrieved successfully',
    schema: {
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/CardResponseDto' },
        },
        meta: {
          type: 'object',
          properties: {
            currentPage: { type: 'number' },
            pagesCount: { type: 'number' },
            totalCount: { type: 'number' },
            limit: { type: 'number' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  getCardsByCategory(
    @Param('categoryId') categoryId: string,
    @Query('includeInactive', new ParseBoolPipe({ optional: true })) includeInactive?: boolean,
    @Query() paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<CardResponseDto>> {
    const { page = 1, limit = 20 } = paginationDto || {};
    return this.cardsService.getCardsByCategory(categoryId, includeInactive, page, limit);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get card by ID' })
  @ApiParam({ name: 'id', description: 'Card ID' })
  @ApiResponse({
    status: 200,
    description: 'Card retrieved successfully',
    type: CardResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Card not found',
  })
  findOne(@Param('id') id: string): Promise<CardResponseDto> {
    return this.cardsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update card (Admin only)' })
  @ApiParam({ name: 'id', description: 'Card ID' })
  @ApiResponse({
    status: 200,
    description: 'Card updated successfully',
    type: CardResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Card not found',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Brad Pitt' },
        description: { type: 'string', example: 'American actor and film producer' },
        categoryId: { type: 'string', example: 'clq1234567890' },
        difficulty: { type: 'string', enum: ['EASY', 'MEDIUM', 'HARD'], example: 'MEDIUM' },
        hints: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['Born in Oklahoma', 'Won an Oscar for Once Upon a Time in Hollywood']
        },
        isActive: { type: 'boolean', example: true },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Card image file',
        },
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Body() updateCardDto: UpdateCardDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<CardResponseDto> {
    // If image is provided, upload it to Cloudinary
    if (image) {
      // Get the current card to check if it has an existing image
      const currentCard = await this.cardsService.findOne(id);
      
      // Upload the new image
      const result = await this.cloudinaryService.uploadImage(image, 'who-am-i/cards');
      updateCardDto.imageUrl = result.url;
      
      // TODO: Delete old image from Cloudinary if it exists
      // This would require storing the public_id of the image in the database
      // For now, we'll just update with the new image URL
    }
    
    return this.cardsService.update(id, updateCardDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete card (Admin only)' })
  @ApiParam({ name: 'id', description: 'Card ID' })
  @ApiResponse({
    status: 200,
    description: 'Card deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Card not found',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.cardsService.remove(id);
  }

  @Post(':id/upload-image')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Upload card image (Admin only)' })
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
  @ApiParam({ name: 'id', description: 'Card ID' })
  @ApiResponse({
    status: 200,
    description: 'Image uploaded successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Card not found',
  })
  async uploadCardImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Upload image to Cloudinary
    const result = await this.cloudinaryService.uploadImage(file, 'who-am-i/cards');
    
    // Update card with new image URL
    const card = await this.cardsService.update(id, {
      imageUrl: result.url,
    });
    
    return {
      success: true,
      imageUrl: result.url,
      card,
    };
  }
}
