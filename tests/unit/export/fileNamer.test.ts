import { describe, expect, it } from 'vitest';

import { createJpegFileName } from '@/export/fileNamer';

describe('fileNamer', () => {
  it('creates safe JPEG file names from the standard template without patient identifiers', () => {
    const name = createJpegFileName(
      {
        patientName: 'Secret Patient',
        patientId: 'PID-1',
        studyDate: '20260612',
        modality: 'CT',
        seriesNumber: 3,
        instanceNumber: 42
      },
      {
        fileNameTemplateMode: 'preset',
        fileNameTemplatePreset: 'standard',
        fileNameTemplateFields: []
      }
    );

    expect(name).toBe('20260612_CT_S003_I0042.jpg');
    expect(name).not.toContain('Secret');
  });

  it('adds directory-local sequence prefixes when provided', () => {
    const name = createJpegFileName(
      {
        studyDate: '20260612',
        modality: 'MR',
        seriesNumber: 1,
        instanceNumber: 7
      },
      {
        fileNameTemplateMode: 'preset',
        fileNameTemplatePreset: 'standard',
        fileNameTemplateFields: [],
        sequenceNumber: 12
      }
    );

    expect(name).toBe('0012_20260612_MR_S001_I0007.jpg');
  });

  it('renders custom field combinations and keeps unicode descriptions', () => {
    const name = createJpegFileName(
      {
        studyDescription: '胸部平扫',
        seriesDescription: '腹窗 cor&sag 5mm',
        instanceNumber: 54
      },
      {
        fileNameTemplateMode: 'fields',
        fileNameTemplatePreset: 'standard',
        fileNameTemplateFields: [
          'studyDescription',
          'seriesDescription',
          'instanceNumber'
        ]
      }
    );

    expect(name).toBe('胸部平扫_腹窗_cor&sag_5mm_I0054.jpg');
  });

  it('adds suffixes for duplicate names', () => {
    const usedNames = new Set<string>();
    const options = {
      fileNameTemplateMode: 'preset' as const,
      fileNameTemplatePreset: 'standard' as const,
      fileNameTemplateFields: [] as const,
      usedNames
    };
    const first = createJpegFileName({}, options);
    const second = createJpegFileName({}, options);

    expect(first).toBe('unknown_unknown_Sunknown_Iunknown.jpg');
    expect(second).toBe('unknown_unknown_Sunknown_Iunknown_2.jpg');
  });
});
