import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';

@Injectable()
export class CategoriesService {
  private readonly CACHE_TTL = 60 * 15; // 15 minutes
  private readonly CACHE_PREFIX = 'category';

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const { name, description, imageUrl, isActive } = createCategoryDto;

    // Check if category with same name already exists
    const existingCategory = await this.prisma.category.findUnique({
      where: { name },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    const category = await this.prisma.category.create({
      data: {
        name,
        description,
        imageUrl,
        isActive,
      },
      include: {
        _count: {
          select: { cards: true },
        },
      },
    });

    // Invalidate categories cache
    await this.redisService.invalidatePattern(`${this.CACHE_PREFIX}:*`);

    return {
      ...category,
      cardCount: category._count.cards,
    };
  }

  async findAll(includeInactive = false): Promise<CategoryResponseDto[]> {
    const cacheKey = `${this.CACHE_PREFIX}:all:${includeInactive}`;
    
    // Try to get from cache first
    const cachedCategories = await this.redisService.getObject<CategoryResponseDto[]>(cacheKey);
    if (cachedCategories) {
      return cachedCategories;
    }

    const categories = await this.prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        _count: {
          select: { cards: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const result = categories.map(category => ({
      ...category,
      cardCount: category._count.cards,
    }));

    // Cache the result
    await this.redisService.setObject(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async findOne(id: string): Promise<CategoryResponseDto> {
    const cacheKey = `${this.CACHE_PREFIX}:${id}`;
    
    // Try to get from cache first
    const cachedCategory = await this.redisService.getObject<CategoryResponseDto>(cacheKey);
    if (cachedCategory) {
      return cachedCategory;
    }

    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { cards: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const result = {
      ...category,
      cardCount: category._count.cards,
    };

    // Cache the result
    await this.redisService.setObject(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    // Check if name is being updated and if it conflicts
    if (updateCategoryDto.name && updateCategoryDto.name !== existingCategory.name) {
      const nameConflict = await this.prisma.category.findUnique({
        where: { name: updateCategoryDto.name },
      });

      if (nameConflict) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        _count: {
          select: { cards: true },
        },
      },
    });

    // Invalidate cache
    await this.redisService.invalidatePattern(`${this.CACHE_PREFIX}:*`);

    return {
      ...updatedCategory,
      cardCount: updatedCategory._count.cards,
    };
  }

  async remove(id: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { cards: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category._count.cards > 0) {
      throw new BadRequestException(
        'Cannot delete category that contains cards. Please delete all cards first or transfer them to another category.',
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    // Invalidate cache
    await this.redisService.invalidatePattern(`${this.CACHE_PREFIX}:*`);
  }

  async getActiveCategories(): Promise<CategoryResponseDto[]> {
    return this.findAll(false);
  }

  async getCategoryStats(id: string): Promise<{
    totalCards: number;
    activeCards: number;
    difficultyDistribution: Record<number, number>;
  }> {
    const cacheKey = `${this.CACHE_PREFIX}:stats:${id}`;
    
    // Try to get from cache first
    const cachedStats = await this.redisService.getObject(cacheKey);
    if (cachedStats) {
      return cachedStats;
    }

    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        cards: {
          select: {
            isActive: true,
            difficulty: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const totalCards = category.cards.length;
    const activeCards = category.cards.filter(card => card.isActive).length;
    
    const difficultyDistribution = category.cards.reduce((acc, card) => {
      acc[card.difficulty] = (acc[card.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const result = {
      totalCards,
      activeCards,
      difficultyDistribution,
    };

    // Cache the result
    await this.redisService.setObject(cacheKey, result, this.CACHE_TTL);

    return result;
  }
}
