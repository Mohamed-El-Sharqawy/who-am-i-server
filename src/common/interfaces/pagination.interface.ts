export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  currentPage: number;
  pagesCount: number;
  totalCount: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}
