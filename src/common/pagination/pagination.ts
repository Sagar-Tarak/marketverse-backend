export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export interface PageRequest {
  readonly page: number;
  readonly limit: number;
}

export interface Page<T> extends PageRequest {
  readonly items: readonly T[];
  readonly total: number;
}

/** Prisma `skip`/`take` for a page request. */
export function skipTake({ page, limit }: PageRequest): {
  skip: number;
  take: number;
} {
  return { skip: (page - 1) * limit, take: limit };
}

export function toPage<T>(
  items: readonly T[],
  total: number,
  { page, limit }: PageRequest,
): Page<T> {
  return { items, page, limit, total };
}

export function isPage(value: unknown): value is Page<unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<Record<keyof Page<unknown>, unknown>>;
  return (
    Array.isArray(candidate.items) &&
    typeof candidate.page === 'number' &&
    typeof candidate.limit === 'number' &&
    typeof candidate.total === 'number'
  );
}
