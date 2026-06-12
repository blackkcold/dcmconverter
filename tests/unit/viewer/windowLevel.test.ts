import { describe, expect, it } from 'vitest';

import { adjustWindowLevel, normalizeWindowLevel } from '@/viewer/windowLevel';

describe('windowLevel', () => {
  it('uses defaults when values are missing', () => {
    expect(normalizeWindowLevel(undefined, undefined)).toEqual({
      center: 40,
      width: 400
    });
  });

  it('prevents non-positive window width', () => {
    expect(normalizeWindowLevel(50, 0)).toEqual({ center: 50, width: 400 });
    expect(adjustWindowLevel({ center: 50, width: 10 }, 0, -20)).toEqual({
      center: 50,
      width: 1
    });
  });
});
