import { describe, expect, it, vi } from 'vitest';

import { exportCanvasAsJpeg } from '@/export/exportController';
import { DEFAULT_EXPORT_OPTIONS } from '@/export/exportTypes';
import { createZipFromJpegs } from '@/export/zipExporter';

describe('export pipeline', () => {
  it('exports a canvas to JPEG and then packs it into ZIP', async () => {
    const sourceCanvas = {
      width: 16,
      height: 16
    } as HTMLCanvasElement;
    const clonedCanvas = {
      width: 16,
      height: 16,
      getContext: vi.fn(() => null),
      toBlob: vi.fn((callback: BlobCallback) =>
        callback(new Blob(['jpeg'], { type: 'image/jpeg' }))
      )
    } as unknown as HTMLCanvasElement;

    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockReturnValue(clonedCanvas);

    const result = await exportCanvasAsJpeg({
      canvas: sourceCanvas,
      fileId: 'file_abcd',
      metadata: { studyDate: '20260612', modality: 'CT' },
      options: DEFAULT_EXPORT_OPTIONS
    });
    const zip = await createZipFromJpegs([result]);

    expect(result.fileName).toBe(
      '20260612_unknownPatient_CT_Sunknown_Iunknown_abcd.jpg'
    );
    expect(zip.ok).toBe(true);

    createElementSpy.mockRestore();
  });
});
