import type { DicomMetadata } from '@/dicom/dicomTypes';

const SAFE_FILE_NAME_PATTERN = /[^A-Za-z0-9_.-]+/g;

export function createJpegFileName(
  metadata: DicomMetadata,
  fileId: string,
  usedNames: Set<string> = new Set(),
  includePersonalInfo = false
): string {
  const parts = [
    metadata.studyDate ?? 'unknown',
    ...(includePersonalInfo ? [metadata.patientId ?? 'unknownPatient'] : []),
    metadata.modality ?? 'unknown',
    `S${metadata.seriesNumber ?? 'unknown'}`,
    `I${metadata.instanceNumber ?? 'unknown'}`,
    fileId.replace(/^file_/, '')
  ];
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
