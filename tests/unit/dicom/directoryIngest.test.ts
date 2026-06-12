import { describe, expect, it } from 'vitest';

import { getRelativePath, ingestFiles } from '@/dicom/fileIngest';

function createDirectoryFile(path: string): File {
  const file = new File(['DICM'], path.split('/').at(-1) ?? 'scan.dcm', {
    lastModified: 1
  });
  Object.defineProperty(file, 'webkitRelativePath', {
    value: path,
    configurable: true
  });
  return file;
}

describe('directory ingest', () => {
  it('keeps webkitRelativePath when directory is selected', () => {
    const file = createDirectoryFile('study/series/scan.dcm');

    expect(getRelativePath(file)).toBe('study/series/scan.dcm');
  });

  it('flattens files while preserving hierarchy and sorting by path', () => {
    const result = ingestFiles([
      createDirectoryFile('study/b/2.dcm'),
      createDirectoryFile('study/a/1.dcm')
    ]);

    expect(result.files.map((file) => file.relativePath)).toEqual([
      'study/a/1.dcm',
      'study/b/2.dcm'
    ]);
  });

  it('ignores unsupported files in selected directories', () => {
    const result = ingestFiles([
      createDirectoryFile('study/a/1.dcm'),
      createDirectoryFile('study/a/readme.txt')
    ]);

    expect(result.files).toHaveLength(1);
    expect(result.skippedFiles).toHaveLength(1);
  });
});
