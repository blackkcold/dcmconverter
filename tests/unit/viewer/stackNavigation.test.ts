import { describe, expect, it } from 'vitest';

import { getNextStackIndex } from '@/viewer/stackNavigation';

describe('stackNavigation', () => {
  it('clamps navigation inside stack bounds', () => {
    expect(getNextStackIndex(0, 5, -1)).toBe(0);
    expect(getNextStackIndex(4, 5, 1)).toBe(4);
    expect(getNextStackIndex(2, 5, 1)).toBe(3);
  });

  it('returns -1 for empty stacks', () => {
    expect(getNextStackIndex(0, 0, 1)).toBe(-1);
  });
});
