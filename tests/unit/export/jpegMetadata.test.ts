import { describe, expect, it } from 'vitest';

import {
  createJpegMetadataPayload,
  injectJpegExifMetadata
} from '@/export/jpegMetadata';

describe('jpegMetadata', () => {
  it('builds ImageDescription and compact UserComment JSON', () => {
    const payload = createJpegMetadataPayload({
      burnedInAnnotation: true,
      windowLevel: { center: 40, width: 350 },
      metadata: {
        modality: 'CT',
        imageType: ['DERIVED', 'SECONDARY', 'AXIAL', 'HELICAL'],
        studyDate: '20260604',
        studyTime: '091916',
        seriesNumber: 2,
        instanceNumber: 54,
        seriesDescription: '腹窗 cor&sag 5mm',
        protocolName: '腹部平扫+薄层',
        rows: 512,
        columns: 512,
        pixelSpacing: [0.7001495361, 0.7001495361],
        sliceThickness: 5,
        spacingBetweenSlices: 5,
        rescaleIntercept: -1024,
        rescaleSlope: 1,
        rescaleType: 'HU',
        manufacturer: 'NMS',
        manufacturerModelName: 'NeuViz Epoch'
      }
    });
    const comment = JSON.parse(payload.userComment) as {
      schema: string;
      source: { protocolName: string };
      rendering: { burnedInAnnotation: boolean };
      device: { model: string };
    };

    expect(payload.imageDescription).toContain('DICOM-JPEG v1 | CT');
    expect(payload.imageDescription).toContain('WC/WW=40/350');
    expect(payload.imageDescription).toContain('PixelSpacing=0.70015x0.70015');
    expect(comment.schema).toBe('dicom-jpeg-meta/v1');
    expect(comment.source.protocolName).toBe('腹部平扫+薄层');
    expect(comment.rendering.burnedInAnnotation).toBe(true);
    expect(comment.device.model).toBe('NeuViz Epoch');
  });

  it('injects an APP1 EXIF segment into JPEG bytes', async () => {
    const source = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], {
      type: 'image/jpeg'
    });
    const output = await injectJpegExifMetadata(source, {
      imageDescription: 'DICOM-JPEG v1 | CT',
      userComment: '{"schema":"dicom-jpeg-meta/v1"}'
    });
    const bytes = await readBlobBytes(output);
    const text = new TextDecoder().decode(bytes);

    expect(bytes.slice(0, 4)).toEqual(new Uint8Array([0xff, 0xd8, 0xff, 0xe1]));
    expect(text).toContain('Exif');
    expect(text).toContain('DICOM-JPEG v1');
    expect(text).toContain('dicom-jpeg-meta/v1');
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
