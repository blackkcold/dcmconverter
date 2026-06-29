import { describe, expect, it } from 'vitest';

import {
  createExifApp1Segment,
  createJpegMetadataPayload,
  injectJpegExifMetadata
} from '@/export/jpegMetadata';

describe('jpegMetadata', () => {
  it('builds ImageDescription and compact UserComment JSON', () => {
    const payload = createJpegMetadataPayload({
      burnedInAnnotation: true,
      windowLevel: { center: 40, width: 350 },
      locale: 'en',
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
    const comment = JSON.parse(payload.userComment!) as {
      schema: string;
      source: { protocolName: string };
      rendering: { burnedInAnnotation: boolean };
      device: { model: string };
    };

    expect(payload.imageDescription).toContain('DICOM-JPEG v1 | CT');
    expect(payload.imageDescription).toContain('WC/WW=40/350');
    expect(payload.imageDescription).toContain('Pixel Spacing=0.70015x0.70015');
    expect(payload.imageDescription).toContain('Slice Thickness=5mm');
    expect(payload.imageDescription).toContain('OverlayBurnedIn=YES');
    expect(comment.schema).toBe('dicom-jpeg-meta/v1');
    expect(comment.source.protocolName).toBe('腹部平扫+薄层');
    expect(comment.rendering.burnedInAnnotation).toBe(true);
    expect(comment.device.model).toBe('NeuViz Epoch');
  });

  it('uses OverlayBurnedIn=NO when burnedInAnnotation is false', () => {
    const payload = createJpegMetadataPayload({
      burnedInAnnotation: false,
      metadata: { modality: 'CT' }
    });

    expect(payload.imageDescription).toContain('OverlayBurnedIn=NO');
  });

  it('injects both ImageDescription and UserComment into JPEG bytes', async () => {
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

  it('injects only ImageDescription when UserComment is undefined', async () => {
    const payload = {
      imageDescription: 'DICOM-JPEG v1 | CT',
      userComment: undefined
    };

    const segment = createExifApp1Segment(payload);
    const text = new TextDecoder().decode(segment);

    expect(text).toContain('DICOM-JPEG v1 | CT');
    expect(text).toContain('Exif');
    expect(text).not.toContain('dicom-jpeg-meta');
  });

  it('injects only UserComment when ImageDescription is undefined', async () => {
    const payload = {
      imageDescription: undefined,
      userComment: '{"schema":"dicom-jpeg-meta/v1"}'
    };

    const segment = createExifApp1Segment(payload);
    const text = new TextDecoder().decode(segment);

    expect(text).toContain('dicom-jpeg-meta/v1');
    expect(text).toContain('Exif');
    expect(text).not.toContain('DICOM-JPEG');
  });

  it('throws when both fields are undefined', () => {
    expect(() =>
      createExifApp1Segment({ imageDescription: undefined, userComment: undefined })
    ).toThrow('at least one field');
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
