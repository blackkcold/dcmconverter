import { describe, expect, it } from 'vitest';

import type { LocalDicomFile } from '@/dicom/dicomTypes';
import { groupDicomFiles } from '@/dicom/seriesGrouper';

function localFile(id: string, name: string): LocalDicomFile {
  return {
    id,
    file: new File(['DICM'], name),
    name,
    size: 4,
    relativePath: name,
    lastModified: 1
  };
}

describe('seriesGrouper', () => {
  it('groups files by study and series then sorts instances', () => {
    const studies = groupDicomFiles([localFile('b', 'b.dcm'), localFile('a', 'a.dcm')], {
      a: {
        studyInstanceUID: 'study-1',
        seriesInstanceUID: 'series-1',
        instanceNumber: 1,
        seriesNumber: 2
      },
      b: {
        studyInstanceUID: 'study-1',
        seriesInstanceUID: 'series-1',
        instanceNumber: 2,
        seriesNumber: 2
      }
    });

    expect(studies).toHaveLength(1);
    expect(studies[0]?.series[0]?.instances.map((item) => item.fileId)).toEqual([
      'a',
      'b'
    ]);
  });
});
