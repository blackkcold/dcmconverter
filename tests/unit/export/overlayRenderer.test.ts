import { describe, expect, it } from 'vitest';

import {
  NON_DIAGNOSTIC_WATERMARK,
  buildOverlayLineGroups
} from '@/export/overlayRenderer';

describe('overlayRenderer', () => {
  it('renders anonymized patient fields by default', () => {
    const groups = buildOverlayLineGroups(
      { patientName: 'Jane Doe', patientId: '12345' },
      { anonymizeOverlay: true }
    );
    const allLines = groups.flatMap((group) => group.lines);

    expect(allLines).toContain('Patient: Anonymous');
    expect(allLines).toContain('ID: Hidden');
    expect(allLines.join('\n')).not.toContain('Jane Doe');
  });

  it('renders modality, series, instance, window level, and watermark', () => {
    const groups = buildOverlayLineGroups(
      {
        modality: 'CT',
        seriesNumber: 3,
        instanceNumber: 42,
        windowCenter: 40,
        windowWidth: 400,
        rows: 512,
        columns: 512
      },
      { anonymizeOverlay: true }
    );
    const text = groups.flatMap((group) => group.lines).join('\n');

    expect(text).toContain('Modality: CT');
    expect(text).toContain('Series: 3');
    expect(text).toContain('Instance: 42');
    expect(text).toContain('WC/WW: 40 / 400');
    expect(text).toContain(NON_DIAGNOSTIC_WATERMARK);
  });
});
