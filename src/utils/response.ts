import { PaginatedResult, PaginationOptions } from '../types';

/** Wrap a payload in the standard success envelope. */
export function success<T>(data: T): { data: T } {
  return { data };
}

/** Wrap a page of rows plus pagination metadata. */
export function paginated<T>(
  rows: T[],
  total: number,
  { page, limit }: PaginationOptions,
): PaginatedResult<T> {
  return {
    data: rows,
    meta: {
      page,
      limit,
      total,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
    },
  };
}
