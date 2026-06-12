import type {
  DicomMetadata,
  DicomStudy,
  LocalDicomFile
} from '@/dicom/dicomTypes';

import type { ExportJob, ExportOptions } from './exportTypes';
import { createJpegFileName } from './fileNamer';
import { hashJson } from './hash';

export interface BuildExportJobsInput {
  files: readonly LocalDicomFile[];
  studies: readonly DicomStudy[];
  metadataByFileId: Readonly<Record<string, DicomMetadata>>;
  activeFileId?: string;
  options: ExportOptions;
}

export function buildExportJobs(input: BuildExportJobsInput): {
  datasetHash: string;
  optionsHash: string;
  jobs: ExportJob[];
} {
  const selectedFiles = selectFiles(input);
  const sortedFiles = [...selectedFiles].sort((a, b) =>
    compareFilesByDicomOrder(a, b, input.metadataByFileId)
  );
  const usedNames = new Set<string>();
  const optionsHash = hashExportOptions(input.options);
  const datasetHash = hashDataset(sortedFiles);

  return {
    datasetHash,
    optionsHash,
    jobs: sortedFiles.map((file, index) => {
      const metadata = input.metadataByFileId[file.id] ?? {};
      const metadataHash = hashJson(metadata);

      return {
        id: `export_${file.id}`,
        fileId: file.id,
        status: 'pending',
        batchIndex: Math.floor(index / input.options.batchSize),
        outputFileName: createJpegFileName(
          metadata,
          file.id,
          usedNames,
          input.options.includePersonalInfo
        ),
        sourceRelativePath: file.relativePath,
        retryCount: 0,
        metadataHash,
        optionsHash
      };
    })
  };
}

export function splitIntoBatches<T>(
  items: readonly T[],
  batchSize: number
): T[][] {
  const normalizedBatchSize = Number.isFinite(batchSize)
    ? Math.max(1, Math.floor(batchSize))
    : 1;
  const batches: T[][] = [];

  for (let index = 0; index < items.length; index += normalizedBatchSize) {
    batches.push(items.slice(index, index + normalizedBatchSize));
  }

  return batches;
}

export function hashExportOptions(options: ExportOptions): string {
  return hashJson({
    jpegQuality: options.jpegQuality,
    includeOverlay: options.includeOverlay,
    anonymizeOverlay: options.anonymizeOverlay,
    includePersonalInfo: options.includePersonalInfo,
    overlayPosition: options.overlayPosition,
    useCurrentWindowLevel: options.useCurrentWindowLevel
  });
}

function selectFiles(input: BuildExportJobsInput): LocalDicomFile[] {
  if (input.options.scope === 'all') {
    return [...input.files];
  }

  if (!input.activeFileId) {
    return [];
  }

  if (input.options.scope === 'current') {
    return input.files.filter((file) => file.id === input.activeFileId);
  }

  const activeMetadata = input.metadataByFileId[input.activeFileId];
  const activeSeriesId = activeMetadata?.seriesInstanceUID;

  if (!activeSeriesId) {
    return input.files.filter((file) => file.id === input.activeFileId);
  }

  return input.files.filter(
    (file) => input.metadataByFileId[file.id]?.seriesInstanceUID === activeSeriesId
  );
}

function compareFilesByDicomOrder(
  a: LocalDicomFile,
  b: LocalDicomFile,
  metadataByFileId: Readonly<Record<string, DicomMetadata>>
): number {
  const left = metadataByFileId[a.id] ?? {};
  const right = metadataByFileId[b.id] ?? {};

  return (
    compareString(left.studyDate, right.studyDate) ||
    compareNumber(left.seriesNumber, right.seriesNumber) ||
    compareNumber(left.instanceNumber, right.instanceNumber) ||
    a.relativePath.localeCompare(b.relativePath)
  );
}

function compareString(a?: string, b?: string): number {
  return (a ?? '99999999').localeCompare(b ?? '99999999');
}

function compareNumber(a?: number, b?: number): number {
  return (a ?? Number.MAX_SAFE_INTEGER) - (b ?? Number.MAX_SAFE_INTEGER);
}

function hashDataset(files: readonly LocalDicomFile[]): string {
  return hashJson(
    files.map((file) => ({
      id: file.id,
      relativePath: file.relativePath,
      size: file.size,
      lastModified: file.lastModified
    }))
  );
}
