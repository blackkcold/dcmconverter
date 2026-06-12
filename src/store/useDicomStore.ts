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
  setActiveFileId(fileId: string): void;
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
  setActiveFileId: (fileId) => set({ activeFileId: fileId }),
  clear: () =>
    set({
      files: [],
      metadataByFileId: {},
      studies: [],
      activeFileId: undefined,
      skippedFiles: []
    })
}));

export function useActiveDicomFile(): LocalDicomFile | undefined {
  const { files, activeFileId } = useDicomStore();
  return files.find((file) => file.id === activeFileId);
}

export function useActiveDicomMetadata(): DicomMetadata | undefined {
  const { activeFileId, metadataByFileId } = useDicomStore();
  return activeFileId ? metadataByFileId[activeFileId] : undefined;
}

function dedupeFiles(files: LocalDicomFile[]): LocalDicomFile[] {
  return Array.from(new Map(files.map((file) => [file.id, file])).values());
}
