import { describe, expect, it } from 'vitest';

import { parseDicomMetadataFromBytes } from '@/dicom/metadataParser';

describe('metadataParser', () => {
  it('decodes GB18030 text tags, numeric values, and extended metadata from DICOM bytes', () => {
    const bytes = createDicomBytes();
    const result = parseDicomMetadataFromBytes(bytes);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value).toMatchObject({
      specificCharacterSet: 'GB18030',
      imageType: ['DERIVED', 'SECONDARY', 'AXIAL', 'HELICAL'],
      modality: 'CT',
      manufacturer: 'NMS',
      manufacturerModelName: 'NeuViz Epoch',
      protocolName: 'abdomen thin',
      seriesDescription: '腹窗 cor&sag 5mm',
      seriesNumber: 10002,
      rows: 828,
      columns: 512,
      windowCenter: 40,
      windowWidth: 350,
      sliceThickness: 5,
      spacingBetweenSlices: 5,
      pixelSpacing: [0.7001495361, 0.7001495361],
      rescaleIntercept: -1024,
      rescaleSlope: 1,
      rescaleType: 'HU'
    });
  });
});

function createDicomBytes(): Uint8Array {
  const metaElements = [
    createElement(0x0002, 0x0010, 'UI', ascii('1.2.840.10008.1.2.1'))
  ];
  const metaLength = metaElements.reduce((total, item) => total + item.length, 0);
  const elements = [
    createElement(0x0002, 0x0000, 'UL', uint32(metaLength)),
    ...metaElements,
    createElement(0x0008, 0x0005, 'CS', ascii('GB18030')),
    createElement(0x0008, 0x0008, 'CS', ascii('DERIVED\\SECONDARY\\AXIAL\\HELICAL')),
    createElement(0x0008, 0x0060, 'CS', ascii('CT')),
    createElement(0x0008, 0x0070, 'LO', ascii('NMS')),
    createElement(
      0x0008,
      0x103e,
      'LO',
      bytes(0xb8, 0xb9, 0xb4, 0xb0, ...ascii(' cor&sag 5mm'))
    ),
    createElement(0x0008, 0x1090, 'LO', ascii('NeuViz Epoch')),
    createElement(0x0018, 0x0050, 'DS', ascii('5')),
    createElement(0x0018, 0x0088, 'DS', ascii('5')),
    createElement(0x0018, 0x1030, 'LO', ascii('abdomen thin')),
    createElement(0x0020, 0x0011, 'IS', ascii('10002')),
    createElement(0x0028, 0x0010, 'US', uint16(828)),
    createElement(0x0028, 0x0011, 'US', uint16(512)),
    createElement(0x0028, 0x0030, 'DS', ascii('0.7001495361\\0.7001495361')),
    createElement(0x0028, 0x1050, 'DS', ascii('40')),
    createElement(0x0028, 0x1051, 'DS', ascii('350')),
    createElement(0x0028, 0x1052, 'DS', ascii('-1024')),
    createElement(0x0028, 0x1053, 'DS', ascii('1')),
    createElement(0x0028, 0x1054, 'LO', ascii('HU'))
  ];

  return bytes(
    ...new Array(128).fill(0),
    ...ascii('DICM'),
    ...elements.flatMap((item) => Array.from(item))
  );
}

function createElement(
  group: number,
  element: number,
  vr: string,
  value: Uint8Array
): Uint8Array {
  const paddedValue = padEven(value, vr === 'UI' ? 0 : 0x20);
  return bytes(
    ...uint16(group),
    ...uint16(element),
    ...ascii(vr),
    ...uint16(paddedValue.length),
    ...paddedValue
  );
}

function padEven(value: Uint8Array, padByte: number): Uint8Array {
  if (value.length % 2 === 0) {
    return value;
  }

  return bytes(...value, padByte);
}

function ascii(value: string): Uint8Array {
  return bytes(...Array.from(value, (char) => char.charCodeAt(0)));
}

function uint16(value: number): Uint8Array {
  return bytes(value & 0xff, (value >> 8) & 0xff);
}

function uint32(value: number): Uint8Array {
  return bytes(
    value & 0xff,
    (value >> 8) & 0xff,
    (value >> 16) & 0xff,
    (value >> 24) & 0xff
  );
}

function bytes(...values: number[]): Uint8Array {
  return Uint8Array.from(values);
}
