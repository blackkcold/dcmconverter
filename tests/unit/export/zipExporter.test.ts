import { describe, expect, it } from 'vitest';

import { createZipFromJpegs } from '@/export/zipExporter';

describe('zipExporter', () => {
  it('creates a ZIP blob from JPEG results', async () => {
    const result = await createZipFromJpegs([
      {
        fileId: 'file_1',
        fileName: 'one.jpg',
        blob: new Blob(['jpeg'], { type: 'image/jpeg' })
      }
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.type).toBe('application/zip');
      expect(result.value.size).toBeGreaterThan(0);
    }
  });
});
