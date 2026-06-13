import type { FileIngestResult, LocalDicomFile, SkippedFile } from './dicomTypes';
import { createTranslator, getCurrentLocale, type Locale } from '@/i18n';

const ACCEPTED_EXTENSIONS = new Set(['.dcm', '.dicom', '.ima']);
const KNOWN_NON_DICOM_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.txt',
  '.csv',
  '.pdf',
  '.json',
  '.zip'
]);

const KNOWN_NON_DICOM_NAMES = new Set([
  '.DS_Store',
  'DICOMDIR',
  'Thumbs.db'
]);

export function ingestFiles(
  input: FileList | readonly File[],
  locale: Locale = getCurrentLocale()
): FileIngestResult {
  const t = createTranslator(locale);
  const files = Array.from(input);

  if (files.length === 0) {
    return {
      files: [],
      skippedFiles: [{ name: t('ingest.emptySelection'), reason: t('ingest.noFilesSelected') }]
    };
  }

  const accepted: LocalDicomFile[] = [];
  const skippedFiles: SkippedFile[] = [];

  files.forEach((file, index) => {
    if (!isPotentialDicomFile(file)) {
      skippedFiles.push({
        name: file.name,
        reason: t('ingest.unsupportedExtension')
      });
      return;
    }

    const relativePath = getRelativePath(file);
    accepted.push({
      id: createLocalFileId(file, index),
      file,
      name: file.name,
      size: file.size,
      relativePath,
      lastModified: file.lastModified
    });
  });

  accepted.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  return { files: accepted, skippedFiles };
}

export function isPotentialDicomFile(file: File): boolean {
  const extension = getExtension(file.name);

  if (ACCEPTED_EXTENSIONS.has(extension)) {
    return true;
  }

  if (KNOWN_NON_DICOM_EXTENSIONS.has(extension)) {
    return false;
  }

  return extension === '' && !KNOWN_NON_DICOM_NAMES.has(file.name);
}

export function getRelativePath(file: File): string {
  const candidate = getWebkitRelativePath(file);
  return candidate.length > 0 ? candidate : file.name;
}

export function createLocalFileId(file: File, index = 0): string {
  const source = [
    getRelativePath(file),
    file.size,
    file.lastModified,
    index
  ].join(':');

  let hash = 2166136261;
  for (const char of source) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return `file_${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function getExtension(name: string): string {
  const dotIndex = name.lastIndexOf('.');
  return dotIndex >= 0 ? name.slice(dotIndex).toLowerCase() : '';
}

function getWebkitRelativePath(file: File): string {
  const record = file as File & { webkitRelativePath?: string };
  return record.webkitRelativePath ?? '';
}
