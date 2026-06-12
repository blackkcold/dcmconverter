import { describe, expect, it } from 'vitest';

import { createJpegFileName } from '@/export/fileNamer';

describe('fileNamer', () => {
  it('creates safe JPEG file names without patient identifiers', () => {
    const name = createJpegFileName(
      {
        patientName: 'Secret Patient',
        patientId: 'PID-1',
        studyDate: '20260612',
        modality: 'CT',
        seriesNumber: 3,
        instanceNumber: 42
      },
      'file_ab12cd'
    );

    expect(name).toBe('20260612_CT_S3_I42_ab12cd.jpg');
    expect(name).not.toContain('Secret');
  });

  it('adds suffixes for duplicate names', () => {
    const usedNames = new Set<string>();
    const first = createJpegFileName({}, 'file_same', usedNames);
    const second = createJpegFileName({}, 'file_same', usedNames);

    expect(first).toBe('unknown_unknown_Sunknown_Iunknown_same.jpg');
    expect(second).toBe('unknown_unknown_Sunknown_Iunknown_same_2.jpg');
  });
});
