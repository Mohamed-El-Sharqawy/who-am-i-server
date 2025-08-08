import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { CardResponseDto } from './dto/card-response.dto';
import { GetRandomCardsDto } from './dto/get-random-cards.dto';

@Injectable()
export class CardsService {
  private readonly CACHE_TTL = 60 * 10; // 10 minutes
  private readonly CACHE_PREFIX = 'card';

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async create(createCardDto: CreateCardDto): Promise<CardResponseDto> {
    const { categoryId, name, description, imageUrl, hints, difficulty, isActive } = createCardDto;

    // Verify category exists
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const card = await this.prisma.card.create({
      data: {
        name,
        description,
        imageUrl,
        hints,
        difficulty,
        isActive,
        categoryId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Invalidate related caches
    await this.redisService.invalidatePattern(`${this.CACHE_PREFIX}:*`);
    await this.redisService.invalidatePattern(`category:*`);

    return card;
  }

  async findAll(
    categoryId?: string,
    includeInactive = false,
    page = 1,
    limit = 20,
  ): Promise<{ cards: CardResponseDto[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;
    const cacheKey = `${this.CACHE_PREFIX}:all:${categoryId || 'all'}:${includeInactive}:${page}:${limit}`;
    
    // Try to get from cache first
    const cachedResult = await this.redisService.getObject(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const where = {
      ...(categoryId && { categoryId }),
      ...(includeInactive ? {} : { isActive: true }),
    };

    const [cards, total] = await Promise.all([
      this.prisma.card.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.card.count({ where }),
    ]);

    const result = {
      cards,
      total,
      pages: Math.ceil(total / limit),
    };

    // Cache the result
    await this.redisService.setObject(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async findOne(id: string): Promise<CardResponseDto> {
    const cacheKey = `${this.CACHE_PREFIX}:${id}`;
    
    // Try to get from cache first
    const cachedCard = await this.redisService.getObject<CardResponseDto>(cacheKey);
    if (cachedCard) {
      return cachedCard;
    }

    const card = await this.prisma.card.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Cache the result
    await this.redisService.setObject(cacheKey, card, this.CACHE_TTL);

    return card;
  }

  async getRandomCards(params: GetRandomCardsDto): Promise<CardResponseDto[]> {
    const { count = 5, categoryIds, minDifficulty, maxDifficulty } = params;

    // Validate difficulty range
    if (minDifficulty && maxDifficulty && minDifficulty > maxDifficulty) {
      throw new BadRequestException('Minimum difficulty cannot be greater than maximum difficulty');
    }

    // Build cache key for random cards
    const cacheKey = `${this.CACHE_PREFIX}:random:${count}:${categoryIds?.join(',') || 'all'}:${minDifficulty || 'min'}:${maxDifficulty || 'max'}`;
    
    // For random cards, we use a shorter cache time to ensure variety
    const cachedCards = await this.redisService.getObject<CardResponseDto[]>(cacheKey);
    if (cachedCards) {
      return cachedCards;
    }

    // Build where clause
    const where = {
      isActive: true,
      ...(categoryIds && categoryIds.length > 0 && { categoryId: { in: categoryIds } }),
      ...(minDifficulty && { difficulty: { gte: minDifficulty } }),
      ...(maxDifficulty && { difficulty: { lte: maxDifficulty } }),
      ...(minDifficulty && maxDifficulty && {
        difficulty: { gte: minDifficulty, lte: maxDifficulty },
      }),
    };

    // First, get the total count of matching cards
    const totalCards = await this.prisma.card.count({ where });

    if (totalCards === 0) {
      return [];
    }

    // If we have fewer cards than requested, return all available cards
    const cardsToFetch = Math.min(count, totalCards);

    // Generate random offsets to get diverse cards
    const randomOffsets = this.generateRandomOffsets(cardsToFetch, totalCards);

    // Fetch cards using random offsets
    const cardPromises = randomOffsets.map(offset =>
      this.prisma.card.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip: offset,
        take: 1,
      })
    );

    const cardArrays = await Promise.all(cardPromises);
    const cards = cardArrays.flat();

    // Remove duplicates (in case random offsets generated same card)
    const uniqueCards = cards.filter((card, index, self) =>
      index === self.findIndex(c => c.id === card.id)
    );

    // If we still need more cards and have duplicates, fetch additional ones
    if (uniqueCards.length < cardsToFetch && uniqueCards.length < totalCards) {
      const usedIds = uniqueCards.map(card => card.id);
      const additionalCards = await this.prisma.card.findMany({
        where: {
          ...where,
          id: { notIn: usedIds },
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: cardsToFetch - uniqueCards.length,
      });

      uniqueCards.push(...additionalCards);
    }

    // Shuffle the final result
    const shuffledCards = this.shuffleArray(uniqueCards).slice(0, cardsToFetch);

    // Cache with shorter TTL for randomness
    await this.redisService.setObject(cacheKey, shuffledCards, 60 * 2); // 2 minutes

    return shuffledCards;
  }

  async update(id: string, updateCardDto: UpdateCardDto): Promise<CardResponseDto> {
    const existingCard = await this.prisma.card.findUnique({
      where: { id },
    });

    if (!existingCard) {
      throw new NotFoundException('Card not found');
    }

    // If categoryId is being updated, verify the new category exists
    if (updateCardDto.categoryId && updateCardDto.categoryId !== existingCard.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateCardDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const updatedCard = await this.prisma.card.update({
      where: { id },
      data: updateCardDto,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Invalidate caches
    await this.redisService.invalidatePattern(`${this.CACHE_PREFIX}:*`);
    await this.redisService.invalidatePattern(`category:*`);

    return updatedCard;
  }

  async remove(id: string): Promise<void> {
    const card = await this.prisma.card.findUnique({
      where: { id },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    await this.prisma.card.delete({
      where: { id },
    });

    // Invalidate caches
    await this.redisService.invalidatePattern(`${this.CACHE_PREFIX}:*`);
    await this.redisService.invalidatePattern(`category:*`);
  }

  async getCardsByCategory(categoryId: string, includeInactive = false): Promise<CardResponseDto[]> {
    const result = await this.findAll(categoryId, includeInactive, 1, 1000);
    return result.cards;
  }

  private generateRandomOffsets(count: number, total: number): number[] {
    const offsets = new Set<number>();
    
    while (offsets.size < count && offsets.size < total) {
      const randomOffset = Math.floor(Math.random() * total);
      offsets.add(randomOffset);
    }
    
    return Array.from(offsets);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
