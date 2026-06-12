import { describe, expect, it } from 'vitest';

import { parseDicomMetadataFromBytes } from '@/dicom/metadataParser';

describe('metadataParser', () => {
  it('decodes GB18030 text tags and numeric values from DICOM bytes', () => {
    const bytes = createDicomBytes();
    const result = parseDicomMetadataFromBytes(bytes);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.specificCharacterSet).toBe('GB18030');
    expect(result.value.seriesDescription).toBe('腹窗 cor&sag 5mm');
    expect(result.value.seriesNumber).toBe(10002);
    expect(result.value.rows).toBe(828);
    expect(result.value.columns).toBe(512);
    expect(result.value.windowCenter).toBe(40);
    expect(result.value.windowWidth).toBe(350);
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
    createElement(0x0008, 0x0060, 'CS', ascii('CT')),
    createElement(
      0x0008,
      0x103e,
      'LO',
      bytes(0xb8, 0xb9, 0xb4, 0xb0, ...ascii(' cor&sag 5mm'))
    ),
    createElement(0x0020, 0x0011, 'IS', ascii('10002')),
    createElement(0x0028, 0x0010, 'US', uint16(828)),
    createElement(0x0028, 0x0011, 'US', uint16(512)),
    createElement(0x0028, 0x1050, 'DS', ascii('40')),
    createElement(0x0028, 0x1051, 'DS', ascii('350'))
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
