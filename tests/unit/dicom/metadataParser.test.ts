import { afterEach, describe, expect, it, vi } from 'vitest';
import * as dicomParser from 'dicom-parser';

import { parseDicomMetadataFromBytes } from '@/dicom/metadataParser';
import { DICOM_TAGS } from '@/dicom/metadataMap';

vi.mock('dicom-parser', () => ({
  parseDicom: vi.fn()
}));

function mockDataSet(
  strings: Record<string, string | undefined>,
  uints: Record<string, number | undefined> = {}
) {
  return {
    string: (tag: string) => strings[tag],
    uint16: (tag: string) => uints[tag],
    int16: () => undefined,
    floatString: (tag: string) => {
      const raw = strings[tag]?.split('\\')[0];
      const value = raw === undefined ? undefined : Number(raw);
      return Number.isFinite(value) ? value : undefined;
    }
  };
}

describe('metadataParser', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('parses extended DICOM metadata fields', () => {
    vi.mocked(dicomParser.parseDicom).mockReturnValue(
      mockDataSet(
        {
          [DICOM_TAGS.IMAGE_TYPE]: 'DERIVED\\SECONDARY\\AXIAL\\HELICAL',
          [DICOM_TAGS.PROTOCOL_NAME]: '腹部平扫+薄层',
          [DICOM_TAGS.SERIES_DESCRIPTION]: '腹窗 cor&sag 5mm',
          [DICOM_TAGS.SLICE_THICKNESS]: '5',
          [DICOM_TAGS.SPACING_BETWEEN_SLICES]: '5',
          [DICOM_TAGS.PIXEL_SPACING]: '0.7001495361\\0.7001495361',
          [DICOM_TAGS.RESCALE_INTERCEPT]: '-1024',
          [DICOM_TAGS.RESCALE_SLOPE]: '1',
          [DICOM_TAGS.RESCALE_TYPE]: 'HU',
          [DICOM_TAGS.MANUFACTURER]: 'NMS',
          [DICOM_TAGS.MANUFACTURER_MODEL_NAME]: 'NeuViz Epoch'
        },
        {
          [DICOM_TAGS.ROWS]: 512,
          [DICOM_TAGS.COLUMNS]: 512
        }
      ) as never
    );

    const result = parseDicomMetadataFromBytes(new Uint8Array([1, 2, 3]));

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value).toMatchObject({
      imageType: ['DERIVED', 'SECONDARY', 'AXIAL', 'HELICAL'],
      protocolName: '腹部平扫+薄层',
      seriesDescription: '腹窗 cor&sag 5mm',
      sliceThickness: 5,
      spacingBetweenSlices: 5,
      pixelSpacing: [0.7001495361, 0.7001495361],
      rescaleIntercept: -1024,
      rescaleSlope: 1,
      rescaleType: 'HU',
      manufacturer: 'NMS',
      manufacturerModelName: 'NeuViz Epoch',
      rows: 512,
      columns: 512
    });
  });
});
