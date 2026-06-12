import { describe, expect, it } from 'vitest';

import { ingestFiles } from '@/dicom/fileIngest';
import { groupDicomFiles } from '@/dicom/seriesGrouper';

describe('ingest to grouping', () => {
  it('converts selected files into grouped study tree data', () => {
    const result = ingestFiles([new File(['DICM'], 'a.dcm')]);
    const fileId = result.files[0]?.id;

    expect(fileId).toBeDefined();

    const studies = groupDicomFiles(result.files, {
      [String(fileId)]: {
        studyInstanceUID: 'study',
        seriesInstanceUID: 'series',
        instanceNumber: 1
      }
    });

    expect(studies[0]?.series[0]?.instances[0]?.fileId).toBe(fileId);
  });
});
