import { describe, expect, it, vi } from 'vitest';

import { encodeCanvasToJpeg } from '@/export/jpegEncoder';

describe('jpegEncoder', () => {
  it('encodes a canvas as JPEG blob', async () => {
    const blob = new Blob(['jpeg'], { type: 'image/jpeg' });
    const canvas = {
      toBlob: vi.fn((callback: BlobCallback) => callback(blob))
    } as unknown as HTMLCanvasElement;

    const result = await encodeCanvasToJpeg(canvas, 0.92);

    expect(result.ok).toBe(true);
    expect(canvas.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      'image/jpeg',
      0.92
    );
  });

  it('returns an error when browser encoding fails', async () => {
    const canvas = {
      toBlob: vi.fn((callback: BlobCallback) => callback(null))
    } as unknown as HTMLCanvasElement;

    const result = await encodeCanvasToJpeg(canvas, 0.92);

    expect(result.ok).toBe(false);
  });
});
