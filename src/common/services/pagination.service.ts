import { Injectable } from '@nestjs/common';
import { PaginatedResult, PaginationMeta, PaginationParams } from '../interfaces/pagination.interface';

@Injectable()
export class PaginationService {
  /**
   * Creates a paginated result from an array of items and total count
   * @param items The items for the current page
   * @param totalCount Total number of items across all pages
   * @param page Current page number
   * @param limit Number of items per page
   * @returns PaginatedResult with data and pagination metadata
   */
  paginate<T>(
    items: T[],
    totalCount: number,
    page: number = 1,
    limit: number = 10,
  ): PaginatedResult<T> {
    const pagesCount = Math.ceil(totalCount / limit);
    
    const meta: PaginationMeta = {
      currentPage: page,
      pagesCount,
      totalCount,
      limit,
      hasNext: page < pagesCount,
      hasPrev: page > 1,
    };

    return {
      data: items,
      meta,
    };
  }

  /**
   * Get pagination parameters from query params with defaults
   * @param query Query parameters object
   * @param defaultLimit Default limit if not specified
   * @returns Normalized pagination parameters
   */
  getPaginationParams(
    query: PaginationParams,
    defaultLimit: number = 10,
  ): { page: number; limit: number; skip: number } {
    const page = query.page && query.page > 0 ? Math.floor(query.page) : 1;
    const limit = query.limit && query.limit > 0 ? Math.floor(query.limit) : defaultLimit;
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }
}
