import type { DicomStudy } from '@/dicom/dicomTypes';

export function getNextStackIndex(
  currentIndex: number,
  total: number,
  direction: 1 | -1
): number {
  if (total <= 0) {
    return -1;
  }

  return clamp(currentIndex + direction, 0, total - 1);
}

export function clamp(index: number, min: number, max: number): number {
  return Math.min(Math.max(index, min), max);
}

export function getSeriesFileIdsForActive(
  studies: readonly DicomStudy[],
  activeFileId: string | undefined
): string[] {
  if (!activeFileId) {
    return [];
  }

  for (const study of studies) {
    for (const series of study.series) {
      if (series.instances.some((instance) => instance.fileId === activeFileId)) {
        return series.instances.map((instance) => instance.fileId);
      }
    }
  }

  return [];
}

export function getNextSeriesFileId(
  studies: readonly DicomStudy[],
  activeFileId: string | undefined,
  direction: 1 | -1
): string | undefined {
  const fileIds = getSeriesFileIdsForActive(studies, activeFileId);
  const currentIndex = activeFileId ? fileIds.indexOf(activeFileId) : -1;

  if (currentIndex < 0) {
    return undefined;
  }

  const nextIndex = getNextStackIndex(currentIndex, fileIds.length, direction);
  return nextIndex >= 0 ? fileIds[nextIndex] : undefined;
}
