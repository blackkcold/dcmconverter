import { describe, expect, it } from 'vitest';

import {
  getNextSeriesFileId,
  getNextStackIndex
} from '@/viewer/stackNavigation';

describe('stackNavigation', () => {
  it('clamps navigation inside stack bounds', () => {
    expect(getNextStackIndex(0, 5, -1)).toBe(0);
    expect(getNextStackIndex(4, 5, 1)).toBe(4);
    expect(getNextStackIndex(2, 5, 1)).toBe(3);
  });

  it('returns -1 for empty stacks', () => {
    expect(getNextStackIndex(0, 0, 1)).toBe(-1);
  });

  it('navigates within the active series only', () => {
    const studies = [
      {
        studyInstanceUID: 'study',
        series: [
          {
            seriesInstanceUID: 'series-1',
            instances: [
              { fileId: 'a', metadata: {} },
              { fileId: 'b', metadata: {} }
            ]
          },
          {
            seriesInstanceUID: 'series-2',
            instances: [{ fileId: 'c', metadata: {} }]
          }
        ]
      }
    ];

    expect(getNextSeriesFileId(studies, 'a', 1)).toBe('b');
    expect(getNextSeriesFileId(studies, 'b', 1)).toBe('b');
    expect(getNextSeriesFileId(studies, 'b', -1)).toBe('a');
    expect(getNextSeriesFileId(studies, 'missing', 1)).toBeUndefined();
  });
});
