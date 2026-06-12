import { describe, expect, it } from 'vitest';

import type { LocalDicomFile } from '@/dicom/dicomTypes';
import { DEFAULT_EXPORT_OPTIONS } from '@/export/exportTypes';
import { buildExportJobs, splitIntoBatches } from '@/export/exportJobBuilder';

function localFile(id: string, relativePath: string): LocalDicomFile {
  return {
    id,
    file: new File(['DICM'], relativePath.split('/').at(-1) ?? 'scan.dcm'),
    name: relativePath,
    size: 4,
    relativePath,
    lastModified: 1
  };
}

describe('exportJobBuilder', () => {
  it('sorts export jobs by DICOM order and relative path', () => {
    const first = localFile('first', 'study/2.dcm');
    const second = localFile('second', 'study/1.dcm');
    const result = buildExportJobs({
      files: [first, second],
      studies: [],
      activeFileId: 'first',
      options: { ...DEFAULT_EXPORT_OPTIONS, scope: 'all', batchSize: 25 },
      metadataByFileId: {
        first: { studyDate: '20260612', seriesNumber: 2, instanceNumber: 2 },
        second: { studyDate: '20260612', seriesNumber: 2, instanceNumber: 1 }
      }
    });

    expect(result.jobs.map((job) => job.fileId)).toEqual(['second', 'first']);
  });

  it('splits jobs into stable batches', () => {
    expect(splitIntoBatches([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('includes patient id in names only when personal info is enabled', () => {
    const file = localFile('file_a', 'a.dcm');
    const withPersonalInfo = buildExportJobs({
      files: [file],
      studies: [],
      activeFileId: file.id,
      options: {
        ...DEFAULT_EXPORT_OPTIONS,
        scope: 'all',
        includePersonalInfo: true
      },
      metadataByFileId: {
        [file.id]: { studyDate: '20260612', patientId: 'PID-1', modality: 'CT' }
      }
    });
    const anonymous = buildExportJobs({
      files: [file],
      studies: [],
      activeFileId: file.id,
      options: {
        ...DEFAULT_EXPORT_OPTIONS,
        scope: 'all',
        includePersonalInfo: false
      },
      metadataByFileId: {
        [file.id]: { studyDate: '20260612', patientId: 'PID-1', modality: 'CT' }
      }
    });

    expect(withPersonalInfo.jobs[0]?.outputFileName).toContain('PID-1');
    expect(anonymous.jobs[0]?.outputFileName).not.toContain('PID-1');
  });
});
