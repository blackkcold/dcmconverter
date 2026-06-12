import { describe, expect, it } from 'vitest';

import type { LocalDicomFile } from '@/dicom/dicomTypes';
import { selectNextActiveFileAfterRemoval } from '@/store/useDicomStore';

function localFile(id: string): LocalDicomFile {
  return {
    id,
    file: new File(['DICM'], `${id}.dcm`),
    name: `${id}.dcm`,
    size: 4,
    relativePath: `${id}.dcm`,
    lastModified: 1
  };
}

describe('useDicomStore helpers', () => {
  it('keeps the current active file when it was not removed', () => {
    const files = [localFile('a'), localFile('b')];

    expect(
      selectNextActiveFileAfterRemoval(files, [files[1] as LocalDicomFile], 'b', new Set(['a']))
    ).toBe('b');
  });

  it('selects the next nearby remaining file when the active file was removed', () => {
    const files = [localFile('a'), localFile('b'), localFile('c')];

    expect(
      selectNextActiveFileAfterRemoval(
        files,
        [files[0] as LocalDicomFile, files[2] as LocalDicomFile],
        'b',
        new Set(['b'])
      )
    ).toBe('c');
  });
});
