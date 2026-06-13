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
        callback(
          new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' })
        )
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

  it('uses patient overrides when rendering export overlay', async () => {
    const fillText = vi.fn();
    const sourceCanvas = {
      width: 64,
      height: 64
    } as HTMLCanvasElement;
    const context = {
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      fillRect: vi.fn(),
      fillText
    } as unknown as CanvasRenderingContext2D;
    const clonedCanvas = {
      width: 64,
      height: 64,
      getContext: vi.fn(() => context),
      toBlob: vi.fn((callback: BlobCallback) =>
        callback(
          new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' })
        )
      )
    } as unknown as HTMLCanvasElement;
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockReturnValue(clonedCanvas);

    await exportCanvasAsJpeg({
      canvas: sourceCanvas,
      fileId: 'file_abcd',
      metadata: {
        patientName: 'Original',
        patientSex: 'F',
        patientAge: '030Y',
        studyDate: '20260612',
        modality: 'CT'
      },
      options: {
        ...DEFAULT_EXPORT_OPTIONS,
        patientOverrideEnabled: true,
        patientOverride: {
          patientName: 'Manual Name',
          patientSex: 'M',
          patientAge: '045Y'
        }
      }
    });

    expect(fillText).toHaveBeenCalledWith('Patient: Manual Name', 16, 16);
    expect(fillText).toHaveBeenCalledWith('Sex/Age: M / 045Y', 16, 52);

    createElementSpy.mockRestore();
  });
});
