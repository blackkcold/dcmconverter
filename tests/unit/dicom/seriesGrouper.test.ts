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
    const studies = groupDicomFiles(
      [localFile('b', 'b.dcm'), localFile('a', 'a.dcm')],
      {
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
      }
    );

    expect(studies).toHaveLength(1);
    expect(studies[0]?.series[0]?.instances.map((item) => item.fileId)).toEqual([
      'a',
      'b'
    ]);
  });

  it('uses semantic metadata fallback when series UID is missing', () => {
    const studies = groupDicomFiles(
      [localFile('a', 'folder-1/a.dcm'), localFile('b', 'folder-2/b.dcm')],
      {
        a: {
          studyDate: '20260612',
          protocolName: '腹部平扫+薄层',
          seriesDescription: '腹窗 cor&sag 5mm',
          seriesNumber: 2,
          instanceNumber: 1
        },
        b: {
          studyDate: '20260612',
          protocolName: '腹部平扫+薄层',
          seriesDescription: '腹窗 cor&sag 5mm',
          seriesNumber: 2,
          instanceNumber: 2
        }
      }
    );

    expect(studies).toHaveLength(1);
    expect(studies[0]?.series).toHaveLength(1);
    expect(studies[0]?.series[0]?.protocolName).toBe('腹部平扫+薄层');
    expect(studies[0]?.series[0]?.instances.map((item) => item.fileId)).toEqual([
      'a',
      'b'
    ]);
  });
});
