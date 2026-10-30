import { describe, expect, it } from 'vitest';
import { isPage, skipTake, toPage } from './pagination.js';

describe('pagination helpers', () => {
  it('turns page 3 of 20 into skip 40, take 20', () => {
    expect(skipTake({ page: 3, limit: 20 })).toEqual({ skip: 40, take: 20 });
  });

  it('builds a page and recognises it', () => {
    const page = toPage(['a', 'b'], 5, { page: 1, limit: 2 });
    expect(page).toEqual({ items: ['a', 'b'], page: 1, limit: 2, total: 5 });
    expect(isPage(page)).toBe(true);
  });

  it('does not mistake other values for a page', () => {
    expect(isPage({ items: [] })).toBe(false);
    expect(isPage(null)).toBe(false);
    expect(isPage('text')).toBe(false);
  });
});
