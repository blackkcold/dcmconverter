import { describe, expect, it } from 'vitest';

import type { LocalDicomFile } from '@/dicom/dicomTypes';
import {
  buildImportTree,
  getSelectionState,
  pruneSelection,
  toggleSelection
} from '@/components/study-tree/treeSelection';

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

describe('treeSelection', () => {
  it('builds directory nodes with file ids for folder-level selection', () => {
    const tree = buildImportTree([
      localFile('a', 'root/series/a.dcm'),
      localFile('b', 'root/series/b.dcm'),
      localFile('c', 'root/other/c.dcm')
    ]);

    expect(tree[0]?.name).toBe('root');
    expect(tree[0]?.fileIds).toEqual(['a', 'b', 'c']);
    expect(tree[0]?.children.map((node) => node.name)).toEqual(['other', 'series']);
    expect(tree[0]?.children[1]?.children.map((node) => node.name)).toEqual([
      'a.dcm',
      'b.dcm'
    ]);
  });

  it('toggles multiple file ids and reports indeterminate state', () => {
    const selected = toggleSelection(new Set<string>(), ['a', 'b'], true);

    expect(selected).toEqual(new Set(['a', 'b']));
    expect(getSelectionState(['a', 'b', 'c'], selected)).toEqual({
      checked: false,
      indeterminate: true
    });
    expect(toggleSelection(selected, ['a'], false)).toEqual(new Set(['b']));
  });

  it('prunes removed files from selected ids', () => {
    expect(pruneSelection(new Set(['a', 'b']), new Set(['b', 'c']))).toEqual(
      new Set(['b'])
    );
  });
});
