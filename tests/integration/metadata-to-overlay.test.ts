import { describe, expect, it } from 'vitest';

import { buildOverlayLineGroups } from '@/export/overlayRenderer';

describe('metadata to overlay', () => {
  it('maps DICOM metadata into anonymized overlay text', () => {
    const text = buildOverlayLineGroups(
      {
        patientName: 'Sensitive',
        patientId: 'PID',
        studyDate: '20260612',
        modality: 'MR'
      },
      { anonymizeOverlay: true }
    )
      .flatMap((group) => group.lines)
      .join('\n');

    expect(text).toContain('Anonymous');
    expect(text).toContain('20260612');
    expect(text).toContain('MR');
    expect(text).not.toContain('Sensitive');
  });
});
