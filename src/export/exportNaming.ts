import type { DicomMetadata } from '@/dicom/dicomTypes';
import type { TranslationKey } from '@/i18n';

import type {
  ExportNamingFieldKey,
  FileNameTemplateMode,
  FileNameTemplatePreset
} from './exportTypes';

export interface ExportNameFieldDefinition {
  key: ExportNamingFieldKey;
  labelKey: TranslationKey;
}

export interface FileNameTemplateSettings {
  fileNameTemplateMode: FileNameTemplateMode;
  fileNameTemplatePreset: FileNameTemplatePreset;
  fileNameTemplateFields: readonly ExportNamingFieldKey[];
}

export interface CreateJpegFileNameInput extends FileNameTemplateSettings {
  usedNames?: Set<string>;
  sequenceNumber?: number;
}

export const DEFAULT_EXPORT_PACKAGE_NAME = 'dicom-jpeg-export';

export const EXPORT_NAMING_FIELDS: readonly ExportNameFieldDefinition[] = [
  { key: 'studyDate', labelKey: 'export.namingFieldStudyDate' },
  { key: 'studyDescription', labelKey: 'export.namingFieldStudyDescription' },
  { key: 'modality', labelKey: 'export.namingFieldModality' },
  { key: 'protocolName', labelKey: 'export.namingFieldProtocolName' },
  { key: 'seriesNumber', labelKey: 'export.namingFieldSeriesNumber' },
  { key: 'seriesDescription', labelKey: 'export.namingFieldSeriesDescription' },
  { key: 'instanceNumber', labelKey: 'export.namingFieldInstanceNumber' }
] as const;

const EXPORT_NAMING_FIELD_KEY_SET = new Set<ExportNamingFieldKey>(
  EXPORT_NAMING_FIELDS.map((field) => field.key)
);

export const FILE_NAME_TEMPLATE_PRESETS: Record<
  FileNameTemplatePreset,
  readonly ExportNamingFieldKey[]
> = {
  standard: ['studyDate', 'modality', 'seriesNumber', 'instanceNumber'],
  study: ['studyDate', 'studyDescription', 'modality'],
  series: ['studyDate', 'protocolName', 'seriesDescription', 'instanceNumber']
} as const;

export function normalizeExportPackageName(value: string | undefined): string {
  const trimmed = value?.trim().replace(/\.zip$/i, '') ?? '';
  const safe = safePathSegment(trimmed);
  return safe || DEFAULT_EXPORT_PACKAGE_NAME;
}

export function createExportArchiveFileName(
  exportPackageName: string | undefined
): string {
  return `${normalizeExportPackageName(exportPackageName)}.zip`;
}

export function resolveFileNameTemplateFields(
  options: FileNameTemplateSettings
): readonly ExportNamingFieldKey[] {
  if (options.fileNameTemplateMode === 'fields') {
    const selected = normalizeFieldSelection(options.fileNameTemplateFields);
    return selected.length > 0
      ? selected
      : FILE_NAME_TEMPLATE_PRESETS[options.fileNameTemplatePreset];
  }

  return FILE_NAME_TEMPLATE_PRESETS[options.fileNameTemplatePreset];
}

export function createJpegFileName(
  metadata: DicomMetadata,
  input: CreateJpegFileNameInput
): string {
  const usedNames = input.usedNames ?? new Set<string>();
  const parts = [
    input.sequenceNumber !== undefined ? padSequenceNumber(input.sequenceNumber) : undefined,
    ...resolveFileNameTemplateFields(input).map((field) =>
      formatFieldValue(metadata, field)
    )
  ].filter((part): part is string => part !== undefined);
  const baseName = safePathSegment(parts.join('_')) || 'unknown';

  return reserveUniqueName(`${baseName}.jpg`, usedNames);
}

export function createExportRelativePath(
  exportPackageName: string,
  relativePath: string | undefined,
  fileName: string
): string {
  return joinRelativePath(exportPackageName, relativePath, fileName);
}

export function joinRelativePath(
  ...segments: Array<string | undefined>
): string {
  return segments.filter((segment): segment is string => Boolean(segment)).join('/');
}

export function reserveUniqueName(
  fileName: string,
  usedNames: Set<string>
): string {
  if (!usedNames.has(fileName)) {
    usedNames.add(fileName);
    return fileName;
  }

  const dotIndex = fileName.lastIndexOf('.');
  const stem = dotIndex >= 0 ? fileName.slice(0, dotIndex) : fileName;
  const extension = dotIndex >= 0 ? fileName.slice(dotIndex) : '';
  let counter = 2;

  while (usedNames.has(`${stem}_${counter}${extension}`)) {
    counter += 1;
  }

  const uniqueName = `${stem}_${counter}${extension}`;
  usedNames.add(uniqueName);
  return uniqueName;
}

export function formatFieldValue(
  metadata: DicomMetadata,
  field: ExportNamingFieldKey
): string {
  if (field === 'studyDate') {
    return normalizeTextValue(metadata.studyDate) ?? 'unknown';
  }

  if (field === 'studyDescription') {
    return normalizeTextValue(metadata.studyDescription) ?? 'unknown';
  }

  if (field === 'modality') {
    return normalizeTextValue(metadata.modality) ?? 'unknown';
  }

  if (field === 'protocolName') {
    return normalizeTextValue(metadata.protocolName) ?? 'unknown';
  }

  if (field === 'seriesNumber') {
    return formatNumberPart('S', metadata.seriesNumber, 3);
  }

  if (field === 'seriesDescription') {
    return normalizeTextValue(metadata.seriesDescription) ?? 'unknown';
  }

  return formatNumberPart('I', metadata.instanceNumber, 4);
}

function normalizeFieldSelection(
  fields: readonly ExportNamingFieldKey[]
): ExportNamingFieldKey[] {
  const selected = new Set(fields.filter((field) => EXPORT_NAMING_FIELD_KEY_SET.has(field)));
  const normalized: ExportNamingFieldKey[] = [];

  for (const field of EXPORT_NAMING_FIELDS) {
    if (selected.has(field.key)) {
      normalized.push(field.key);
    }
  }

  return normalized;
}

function normalizeTextValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function padSequenceNumber(value: number): string {
  return Math.max(0, Math.floor(value)).toString().padStart(4, '0');
}

function formatNumberPart(
  prefix: string,
  value: number | undefined,
  width: number
): string {
  if (value === undefined || !Number.isFinite(value)) {
    return `${prefix}unknown`;
  }

  return `${prefix}${Math.max(0, Math.floor(value)).toString().padStart(width, '0')}`;
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
