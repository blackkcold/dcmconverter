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

  it('passes through 100% JPEG quality', async () => {
    const blob = new Blob(['jpeg'], { type: 'image/jpeg' });
    const canvas = {
      toBlob: vi.fn((callback: BlobCallback) => callback(blob))
    } as unknown as HTMLCanvasElement;

    const result = await encodeCanvasToJpeg(canvas, 1);

    expect(result.ok).toBe(true);
    expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 1);
  });

  it('injects EXIF metadata when provided', async () => {
    const canvas = {
      toBlob: vi.fn((callback: BlobCallback) =>
        callback(
          new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' })
        )
      )
    } as unknown as HTMLCanvasElement;

    const result = await encodeCanvasToJpeg(canvas, 0.92, {
      imageDescription: 'DICOM-JPEG v1 | CT | Series=2',
      userComment: '{"schema":"dicom-jpeg-meta/v1"}'
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const bytes = await readBlobBytes(result.value);
    const text = new TextDecoder().decode(bytes);
    expect(bytes.slice(0, 4)).toEqual(new Uint8Array([0xff, 0xd8, 0xff, 0xe1]));
    expect(text).toContain('Exif');
    expect(text).toContain('DICOM-JPEG v1');
    expect(text).toContain('dicom-jpeg-meta/v1');
  });

  it('returns an error when browser encoding fails', async () => {
    const canvas = {
      toBlob: vi.fn((callback: BlobCallback) => callback(null))
    } as unknown as HTMLCanvasElement;

    const result = await encodeCanvasToJpeg(canvas, 0.92);

    expect(result.ok).toBe(false);
  });
});

function readBlobBytes(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob'));
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.readAsArrayBuffer(blob);
  });
}
