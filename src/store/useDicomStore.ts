import { create } from 'zustand';

import type {
  DicomMetadata,
  DicomStudy,
  LocalDicomFile,
  SkippedFile
} from '@/dicom/dicomTypes';
import { groupDicomFiles } from '@/dicom/seriesGrouper';

interface DicomStore {
  files: LocalDicomFile[];
  metadataByFileId: Record<string, DicomMetadata>;
  studies: DicomStudy[];
  activeFileId: string | undefined;
  skippedFiles: SkippedFile[];
  addFiles(files: LocalDicomFile[], skippedFiles: SkippedFile[]): void;
  setMetadata(fileId: string, metadata: DicomMetadata): void;
  batchSetMetadata(entries: (readonly [string, DicomMetadata])[]): void;
  setActiveFileId(fileId: string): void;
  removeFiles(fileIds: readonly string[]): void;
  clear(): void;
}

export const useDicomStore = create<DicomStore>((set) => ({
  files: [],
  metadataByFileId: {},
  studies: [],
  activeFileId: undefined,
  skippedFiles: [],
  addFiles: (files, skippedFiles) =>
    set((state) => {
      const mergedFiles = dedupeFiles([...state.files, ...files]);
      const activeFileId = state.activeFileId ?? mergedFiles[0]?.id;
      return {
        files: mergedFiles,
        skippedFiles: [...state.skippedFiles, ...skippedFiles],
        activeFileId,
        studies: groupDicomFiles(mergedFiles, state.metadataByFileId)
      };
    }),
  setMetadata: (fileId, metadata) =>
    set((state) => {
      const metadataByFileId = {
        ...state.metadataByFileId,
        [fileId]: metadata
      };

      return {
        metadataByFileId,
        studies: groupDicomFiles(state.files, metadataByFileId)
      };
    }),
  batchSetMetadata: (entries) =>
    set((state) => {
      if (entries.length === 0) return state;
      const metadataByFileId = { ...state.metadataByFileId };
      for (const [fileId, metadata] of entries) {
        metadataByFileId[fileId] = metadata;
      }
      return {
        metadataByFileId,
        studies: groupDicomFiles(state.files, metadataByFileId)
      };
    }),
  setActiveFileId: (fileId) => set({ activeFileId: fileId }),
  removeFiles: (fileIds) =>
    set((state) => {
      const removedFileIds = new Set(fileIds);
      if (removedFileIds.size === 0) {
        return state;
      }

      const files = state.files.filter((file) => !removedFileIds.has(file.id));
      const metadataByFileId = Object.fromEntries(
        Object.entries(state.metadataByFileId).filter(
          ([fileId]) => !removedFileIds.has(fileId)
        )
      );
      const activeFileId = selectNextActiveFileAfterRemoval(
        state.files,
        files,
        state.activeFileId,
        removedFileIds
      );

      return {
        files,
        metadataByFileId,
        activeFileId,
        studies: groupDicomFiles(files, metadataByFileId)
      };
    }),
  clear: () => {
    set({
      files: [],
      metadataByFileId: {},
      studies: [],
      activeFileId: undefined,
      skippedFiles: []
    });
  }
}));

export function useActiveDicomFile(): LocalDicomFile | undefined {
  const files = useDicomStore((state) => state.files);
  const activeFileId = useDicomStore((state) => state.activeFileId);
  return files.find((file) => file.id === activeFileId);
}

export function useActiveDicomMetadata(): DicomMetadata | undefined {
  const activeFileId = useDicomStore((state) => state.activeFileId);
  const metadataByFileId = useDicomStore((state) => state.metadataByFileId);
  return activeFileId ? metadataByFileId[activeFileId] : undefined;
}

function dedupeFiles(files: LocalDicomFile[]): LocalDicomFile[] {
  return Array.from(new Map(files.map((file) => [file.id, file])).values());
}

export function selectNextActiveFileAfterRemoval(
  previousFiles: readonly LocalDicomFile[],
  remainingFiles: readonly LocalDicomFile[],
  activeFileId: string | undefined,
  removedFileIds: ReadonlySet<string>
): string | undefined {
  if (!activeFileId) {
    return remainingFiles[0]?.id;
  }

  if (!removedFileIds.has(activeFileId)) {
    return activeFileId;
  }

  const previousIndex = previousFiles.findIndex((file) => file.id === activeFileId);
  if (previousIndex < 0) {
    return remainingFiles[0]?.id;
  }

  const fallbackIndex = Math.min(previousIndex, remainingFiles.length - 1);
  return fallbackIndex >= 0 ? remainingFiles[fallbackIndex]?.id : undefined;
}
