import { describe, expect, it } from 'vitest';

import {
  applyResumeManifest,
  createExportManifest
} from '@/export/exportManifest';
import type { ExportJob } from '@/export/exportTypes';

function job(fileId: string, optionsHash = 'options'): ExportJob {
  return {
    id: `job_${fileId}`,
    fileId,
    status: 'pending',
    batchIndex: 0,
    outputFileName: `${fileId}.jpg`,
    outputRelativePath: `${fileId}.jpg`,
    retryCount: 0,
    metadataHash: 'metadata',
    optionsHash
  };
}

describe('exportManifest', () => {
  it('skips completed jobs when options and metadata match', () => {
    const previous = { ...job('a'), status: 'success' as const };
    const manifest = createExportManifest({
      datasetHash: 'dataset',
      optionsHash: 'options',
      jobs: [previous],
      now: '2026-06-12T00:00:00.000Z'
    });

    const [resumed] = applyResumeManifest([job('a')], manifest, 'options');

    expect(resumed?.status).toBe('skipped');
  });

  it('serializes jobs without source relative paths', () => {
    const manifest = createExportManifest({
      datasetHash: 'dataset',
      optionsHash: 'options',
      jobs: [job('patient-folder')]
    });

    expect(JSON.stringify(manifest)).not.toContain('sourceRelativePath');
    expect(JSON.stringify(manifest)).not.toContain('patient-folder.dcm');
  });

  it('does not skip when export options changed', () => {
    const previous = { ...job('a'), status: 'success' as const };
    const manifest = createExportManifest({
      datasetHash: 'dataset',
      optionsHash: 'old-options',
      jobs: [previous]
    });

    const [resumed] = applyResumeManifest([job('a')], manifest, 'new-options');

    expect(resumed?.status).toBe('pending');
  });
});
