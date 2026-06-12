import type { LocalDicomFile } from '@/dicom/dicomTypes';

export interface ImportTreeNode {
  name: string;
  path: string;
  type: 'directory' | 'file';
  fileId?: string;
  fileIds: string[];
  children: ImportTreeNode[];
}

export interface SelectionState {
  checked: boolean;
  indeterminate: boolean;
}

interface MutableImportTreeNode {
  name: string;
  path: string;
  type: 'directory' | 'file';
  fileId?: string;
  fileIds: string[];
  children: MutableImportTreeNode[];
  childMap: Map<string, MutableImportTreeNode>;
}

export function buildImportTree(files: readonly LocalDicomFile[]): ImportTreeNode[] {
  const root = createDirectoryNode('root', '');

  for (const file of files) {
    const parts = file.relativePath.split('/').filter(Boolean);
    const fileName = parts.at(-1) ?? file.name;
    let parent = root;

    for (const segment of parts.slice(0, -1)) {
      const path = joinPath(parent.path, segment);
      let child = parent.childMap.get(path);

      if (!child) {
        child = createDirectoryNode(segment, path);
        parent.childMap.set(path, child);
        parent.children.push(child);
      }

      child.fileIds.push(file.id);
      parent = child;
    }

    const fileNode: MutableImportTreeNode = {
      name: fileName,
      path: file.relativePath,
      type: 'file',
      fileId: file.id,
      fileIds: [file.id],
      children: [],
      childMap: new Map()
    };

    root.children.push(fileNode);
    root.fileIds.push(file.id);
  }

  return root.children.map(toImportTreeNode).sort(compareImportTreeNodes);
}

export function getSelectionState(
  fileIds: readonly string[],
  selectedFileIds: ReadonlySet<string>
): SelectionState {
  if (fileIds.length === 0) {
    return { checked: false, indeterminate: false };
  }

  const selectedCount = fileIds.filter((fileId) => selectedFileIds.has(fileId)).length;

  return {
    checked: selectedCount === fileIds.length,
    indeterminate: selectedCount > 0 && selectedCount < fileIds.length
  };
}

export function toggleSelection(
  selectedFileIds: ReadonlySet<string>,
  fileIds: readonly string[],
  checked: boolean
): Set<string> {
  const nextSelectedFileIds = new Set(selectedFileIds);

  for (const fileId of fileIds) {
    if (checked) {
      nextSelectedFileIds.add(fileId);
    } else {
      nextSelectedFileIds.delete(fileId);
    }
  }

  return nextSelectedFileIds;
}

export function pruneSelection(
  selectedFileIds: ReadonlySet<string>,
  existingFileIds: ReadonlySet<string>
): Set<string> {
  return new Set(
    Array.from(selectedFileIds).filter((fileId) => existingFileIds.has(fileId))
  );
}

function createDirectoryNode(name: string, path: string): MutableImportTreeNode {
  return {
    name,
    path,
    type: 'directory',
    fileIds: [],
    children: [],
    childMap: new Map()
  };
}

function toImportTreeNode(node: MutableImportTreeNode): ImportTreeNode {
  return {
    name: node.name,
    path: node.path,
    type: node.type,
    ...(node.fileId ? { fileId: node.fileId } : {}),
    fileIds: node.fileIds,
    children: node.children.map(toImportTreeNode).sort(compareImportTreeNodes)
  };
}

function compareImportTreeNodes(a: ImportTreeNode, b: ImportTreeNode): number {
  if (a.type !== b.type) {
    return a.type === 'directory' ? -1 : 1;
  }

  return a.name.localeCompare(b.name);
}

function joinPath(parentPath: string, name: string): string {
  return parentPath ? `${parentPath}/${name}` : name;
}
