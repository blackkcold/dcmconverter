import { describe, expect, it } from 'vitest';

import {
  createLocalFileId,
  getRelativePath,
  ingestFiles,
  isPotentialDicomFile
} from '@/dicom/fileIngest';

function createFile(name: string, content = 'DICM'): File {
  return new File([content], name, { lastModified: 1_700_000_000_000 });
}

describe('fileIngest', () => {
  it('ingests selected DICOM files into LocalDicomFile records', () => {
    const file = createFile('scan.dcm');
    const result = ingestFiles([file]);

    expect(result.skippedFiles).toEqual([]);
    expect(result.files).toHaveLength(1);
    expect(result.files[0]).toMatchObject({
      name: 'scan.dcm',
      size: 4,
      relativePath: 'scan.dcm',
      lastModified: 1_700_000_000_000
    });
  });

  it('generates stable unique file ids from file metadata', () => {
    const file = createFile('scan.dcm');

    expect(createLocalFileId(file, 0)).toBe(createLocalFileId(file, 0));
    expect(createLocalFileId(file, 0)).not.toBe(createLocalFileId(file, 1));
  });

  it('rejects empty selections without throwing', () => {
    const result = ingestFiles([]);

    expect(result.files).toEqual([]);
    expect(result.skippedFiles[0]?.reason).toBe('No files selected');
  });

  it('skips obvious non-DICOM files', () => {
    const result = ingestFiles([createFile('notes.txt')]);

    expect(result.files).toEqual([]);
    expect(result.skippedFiles[0]?.name).toBe('notes.txt');
  });

  it('does not require absolute paths', () => {
    const file = createFile('IM0001');

    expect(isPotentialDicomFile(file)).toBe(true);
    expect(getRelativePath(file)).toBe('IM0001');
  });
});
