import { describe, expect, it } from 'vitest';

import { createExportReport, exportReportToCsv } from '@/export/exportReport';
import type { ExportJob } from '@/export/exportTypes';

function job(): ExportJob {
  return {
    id: 'export_a',
    fileId: 'file_a',
    status: 'success',
    batchIndex: 0,
    outputFileName: '0001_scan.jpg',
    outputRelativePath: 'dicom-jpeg-export/0001_scan.jpg',
    retryCount: 0,
    metadataHash: 'metadata',
    optionsHash: 'options'
  };
}

describe('exportReport', () => {
  it('omits source relative paths from JSON reports', () => {
    const report = createExportReport([job()]);

    expect(JSON.stringify(report)).not.toContain('sourceRelativePath');
  });

  it('omits source relative paths from CSV reports', () => {
    const csv = exportReportToCsv(createExportReport([job()]));

    expect(csv).not.toContain('sourceRelativePath');
    expect(csv).toContain('outputRelativePath');
  });
});
