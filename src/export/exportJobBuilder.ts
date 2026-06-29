import type { DicomMetadata, DicomStudy, LocalDicomFile } from '@/dicom/dicomTypes';

import { applyPatientOverride } from './effectiveMetadata';
import {
  createJpegFileName,
  joinRelativePath,
  normalizeExportPackageName,
  resolveFileNameTemplateFields
} from './exportNaming';
import type { ExportJob, ExportOptions, MetadataFolderField } from './exportTypes';
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
  const usedNamesByDirectory = new Map<string, Set<string>>();
  const sequenceByDirectory = new Map<string, number>();
  const exportPackageName = normalizeExportPackageName(
    input.options.exportPackageName
  );
  const optionsHash = hashExportOptions(input.options);
  const datasetHash = hashDataset(sortedFiles);
  const fileNameTemplate = {
    fileNameTemplateMode: input.options.fileNameTemplateMode,
    fileNameTemplatePreset: input.options.fileNameTemplatePreset,
    fileNameTemplateFields: resolveFileNameTemplateFields(input.options)
  };

  return {
    datasetHash,
    optionsHash,
    jobs: sortedFiles.map((file, index) => {
      const metadata = applyPatientOverride(
        input.metadataByFileId[file.id] ?? {},
        input.options
      );
      const metadataHash = hashJson(metadata);
      const outputDirectory = createOutputDirectory(
        file,
        metadata,
        input.options.outputLayout,
        input.options.metadataFolderField
      );
      const directoryKey = joinRelativePath(exportPackageName, outputDirectory);
      const sequenceNumber = (sequenceByDirectory.get(directoryKey) ?? 0) + 1;
      sequenceByDirectory.set(directoryKey, sequenceNumber);

      const usedNames = getUsedNamesForDirectory(usedNamesByDirectory, directoryKey);
      const outputFileName = createJpegFileName(
        metadata,
        {
          ...fileNameTemplate,
          usedNames,
          sequenceNumber
        }
      );

      return {
        id: `export_${file.id}`,
        fileId: file.id,
        status: 'pending',
        batchIndex: Math.floor(index / input.options.batchSize),
        outputFileName,
        outputRelativePath: joinRelativePath(
          exportPackageName,
          outputDirectory,
          outputFileName
        ),
        retryCount: 0,
        metadataHash,
        optionsHash
      };
    })
  };
}

export function splitIntoBatches<T>(items: readonly T[], batchSize: number): T[][] {
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
  const fileNameTemplateFields = resolveFileNameTemplateFields(options);

  return hashJson({
    exportPackageName: normalizeExportPackageName(options.exportPackageName),
    jpegQuality: options.jpegQuality,
    includeOverlay: options.includeOverlay,
    anonymizeOverlay: options.anonymizeOverlay,
    includePersonalInfo: options.includePersonalInfo,
    patientOverrideEnabled: options.patientOverrideEnabled,
    patientOverride: options.patientOverride,
    includeJpegDescription: options.includeJpegDescription,
    includeJpegExtendedMetadata: options.includeJpegExtendedMetadata,
    overlayPosition: options.overlayPosition,
    useCurrentWindowLevel: options.useCurrentWindowLevel,
    outputLayout: options.outputLayout,
    metadataFolderField: options.metadataFolderField,
    fileNameTemplateMode: options.fileNameTemplateMode,
    fileNameTemplatePreset: options.fileNameTemplatePreset,
    fileNameTemplateFields
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
  const activeSeriesId = activeMetadata
    ? getSeriesSelectionKey(activeMetadata)
    : undefined;

  if (!activeSeriesId) {
    return input.files.filter((file) => file.id === input.activeFileId);
  }

  return input.files.filter(
    (file) =>
      getSeriesSelectionKey(input.metadataByFileId[file.id] ?? {}) === activeSeriesId
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
    compareString(left.protocolName, right.protocolName) ||
    compareString(left.seriesDescription, right.seriesDescription) ||
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

function createOutputDirectory(
  file: LocalDicomFile,
  metadata: DicomMetadata,
  outputLayout: ExportOptions['outputLayout'],
  metadataFolderField: MetadataFolderField
): string | undefined {
  if (outputLayout === 'flat') {
    return undefined;
  }

  if (outputLayout === 'dicomSmart') {
    return createDicomSmartDirectory(metadata);
  }

  if (outputLayout === 'metadataField') {
    return createMetadataFieldDirectory(metadata, metadataFolderField);
  }

  const seriesDirectory = createSeriesDirectory(metadata);
  const sourceDirectory = getSourceDirectory(file.relativePath);

  if (outputLayout === 'series') {
    return seriesDirectory;
  }

  if (outputLayout === 'source') {
    return sourceDirectory;
  }

  return joinRelativePath(seriesDirectory, sourceDirectory);
}

function createSeriesDirectory(metadata: DicomMetadata): string {
  const seriesNumber =
    metadata.seriesNumber !== undefined && Number.isFinite(metadata.seriesNumber)
      ? Math.max(0, Math.floor(metadata.seriesNumber)).toString().padStart(3, '0')
      : 'unknown';
  const modality = metadata.modality ?? 'unknown';
  const seriesId = shortCode(metadata.seriesInstanceUID);

  return joinRelativePath(
    createStudyDirectory(metadata),
    safePathSegment(`S${seriesNumber}_${modality}_${seriesId ?? 'unknown'}`)
  );
}

function createDicomSmartDirectory(metadata: DicomMetadata): string {
  return joinRelativePath(
    joinRelativePath(
      createStudyDirectory(metadata),
      safePathSegment(`Protocol_${metadata.protocolName ?? 'unknown'}`)
    ),
    createSmartSeriesSegment(metadata)
  );
}

function createMetadataFieldDirectory(
  metadata: DicomMetadata,
  metadataFolderField: MetadataFolderField
): string {
  return joinRelativePath(
    createStudyDirectory(metadata),
    createMetadataFieldSegment(metadata, metadataFolderField)
  );
}

function createStudyDirectory(metadata: DicomMetadata): string {
  const studyDate = metadata.studyDate ?? 'unknown';
  const studyId = shortCode(metadata.studyInstanceUID);
  return safePathSegment(
    studyId ? `Study_${studyDate}_${studyId}` : `Study_${studyDate}_unknown`
  );
}

function createSmartSeriesSegment(metadata: DicomMetadata): string {
  const seriesNumber =
    metadata.seriesNumber !== undefined && Number.isFinite(metadata.seriesNumber)
      ? Math.max(0, Math.floor(metadata.seriesNumber)).toString().padStart(3, '0')
      : 'unknown';
  const seriesId = shortCode(metadata.seriesInstanceUID);

  return safePathSegment(
    `S${seriesNumber}_${metadata.seriesDescription ?? 'unknown'}_${
      seriesId ?? 'unknown'
    }`
  );
}

function createMetadataFieldSegment(
  metadata: DicomMetadata,
  metadataFolderField: MetadataFolderField
): string {
  if (metadataFolderField === 'protocolName') {
    return safePathSegment(`Protocol_${metadata.protocolName ?? 'unknown'}`);
  }

  if (metadataFolderField === 'instanceNumber') {
    const instance =
      metadata.instanceNumber !== undefined && Number.isFinite(metadata.instanceNumber)
        ? Math.max(0, Math.floor(metadata.instanceNumber)).toString().padStart(4, '0')
        : 'unknown';
    return safePathSegment(`Instance_${instance}`);
  }

  return safePathSegment(
    `SeriesDescription_${metadata.seriesDescription ?? 'unknown'}`
  );
}

function getSourceDirectory(relativePath: string): string | undefined {
  const parts = relativePath.split('/').filter(Boolean).slice(0, -1);
  const safeParts = parts.map(safePathSegment).filter(Boolean);

  return safeParts.length > 0 ? safeParts.join('/') : undefined;
}

function shortCode(value: string | undefined): string | undefined {
  const safeValue = value?.replace(/[^A-Za-z0-9.-]+/g, '');
  if (!safeValue) {
    return undefined;
  }

  return safeValue.slice(-8);
}

function safePathSegment(value: string): string {
  const normalized = Array.from(value.trim())
    .map((char) => (isUnsafePathChar(char) ? '_' : char))
    .join('')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/[. ]+$/g, '');

  return normalized || 'unknown';
}

function isUnsafePathChar(char: string): boolean {
  return char.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(char);
}

function getSeriesSelectionKey(metadata: DicomMetadata): string | undefined {
  if (metadata.seriesInstanceUID) {
    return metadata.seriesInstanceUID;
  }

  const parts = [
    metadata.seriesNumber,
    metadata.modality,
    metadata.protocolName,
    metadata.seriesDescription
  ].filter((part) => part !== undefined && part !== '');

  return parts.length > 0 ? parts.join(':') : undefined;
}

function getUsedNamesForDirectory(
  usedNamesByDirectory: Map<string, Set<string>>,
  directoryKey: string
): Set<string> {
  const existing = usedNamesByDirectory.get(directoryKey);
  if (existing) {
    return existing;
  }

  const usedNames = new Set<string>();
  usedNamesByDirectory.set(directoryKey, usedNames);
  return usedNames;
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
