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
  @ApiBearerAuth()
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
  create(@Body() createCardDto: CreateCardDto): Promise<CardResponseDto> {
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
  })
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('includeInactive', new ParseBoolPipe({ optional: true })) includeInactive?: boolean,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
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
  @ApiOperation({ summary: 'Get all cards in a specific category' })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Include inactive cards',
  })
  @ApiResponse({
    status: 200,
    description: 'Cards retrieved successfully',
    type: [CardResponseDto],
  })
  getCardsByCategory(
    @Param('categoryId') categoryId: string,
    @Query('includeInactive', new ParseBoolPipe({ optional: true })) includeInactive?: boolean,
  ): Promise<CardResponseDto[]> {
    return this.cardsService.getCardsByCategory(categoryId, includeInactive);
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
  @ApiBearerAuth()
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
  update(
    @Param('id') id: string,
    @Body() updateCardDto: UpdateCardDto,
  ): Promise<CardResponseDto> {
    return this.cardsService.update(id, updateCardDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
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
  @ApiBearerAuth()
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
