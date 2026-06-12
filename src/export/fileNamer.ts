import type { DicomMetadata } from '@/dicom/dicomTypes';

const SAFE_FILE_NAME_PATTERN = /[^A-Za-z0-9_.-]+/g;

export function createJpegFileName(
  metadata: DicomMetadata,
  fileId: string,
  usedNames: Set<string> = new Set(),
  includePersonalInfo = false,
  sequenceNumber?: number
): string {
  const parts = [
    sequenceNumber !== undefined ? padSequenceNumber(sequenceNumber) : undefined,
    metadata.studyDate ?? 'unknown',
    ...(includePersonalInfo ? [metadata.patientId ?? 'unknownPatient'] : []),
    metadata.modality ?? 'unknown',
    formatNumberPart('S', metadata.seriesNumber, 3),
    formatNumberPart('I', metadata.instanceNumber, 4),
    fileId.replace(/^file_/, '')
  ].filter((part): part is string => part !== undefined);
  const baseName = parts
    .join('_')
    .replace(SAFE_FILE_NAME_PATTERN, '_');

  return reserveUniqueName(`${baseName}.jpg`, usedNames);
}

export function reserveUniqueName(fileName: string, usedNames: Set<string>): string {
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
