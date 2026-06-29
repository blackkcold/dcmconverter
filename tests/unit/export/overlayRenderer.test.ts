import { describe, expect, it } from 'vitest';

import {
  getNonDiagnosticWatermark,
  buildOverlayLineGroups
} from '@/export/overlayRenderer';
import { DEFAULT_EXPORT_OPTIONS } from '@/export/exportTypes';

describe('overlayRenderer', () => {
  it('renders anonymized patient fields by default', () => {
    const groups = buildOverlayLineGroups(
      { patientName: 'Jane Doe', patientId: '12345' },
      { anonymizeOverlay: true },
      undefined,
      'en'
    );
    const allLines = groups.flatMap((group) => group.lines);

    expect(allLines).toContain('Patient: Anonymous');
    expect(allLines).toContain('ID: Hidden');
    expect(allLines.join('\n')).not.toContain('Jane Doe');
  });

  it('keeps patient fields anonymous with the default export options', () => {
    const groups = buildOverlayLineGroups(
      { patientName: 'Jane Doe', patientId: 'PID-12345' },
      DEFAULT_EXPORT_OPTIONS,
      undefined,
      'en'
    );
    const text = groups.flatMap((group) => group.lines).join('\n');

    expect(DEFAULT_EXPORT_OPTIONS.includePersonalInfo).toBe(false);
    expect(text).toContain('Patient: Anonymous');
    expect(text).toContain('ID: Hidden');
    expect(text).not.toContain('Jane Doe');
    expect(text).not.toContain('PID-12345');
  });

  it('renders patient fields only when personal info is explicitly enabled', () => {
    const groups = buildOverlayLineGroups(
      { patientName: 'Jane Doe', patientId: 'PID-12345' },
      { ...DEFAULT_EXPORT_OPTIONS, includePersonalInfo: true },
      undefined,
      'en'
    );
    const text = groups.flatMap((group) => group.lines).join('\n');

    expect(text).toContain('Patient: Jane Doe');
    expect(text).toContain('ID: PID-12345');
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
      { anonymizeOverlay: true },
      undefined,
      'en'
    );
    const text = groups.flatMap((group) => group.lines).join('\n');

    expect(text).toContain('Modality: CT');
    expect(text).toContain('Series: 3');
    expect(text).toContain('Instance: 42');
    expect(text).toContain('WC/WW: 40 / 400');
    expect(text).toContain(getNonDiagnosticWatermark('en'));
  });
});
