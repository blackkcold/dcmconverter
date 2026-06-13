import type { AppError } from '@/utils/errors';
import type { Result } from '@/utils/result';
import { err, ok } from '@/utils/result';
import {
  createLocalizedAppError,
  getCurrentLocale,
  type Locale
} from '@/i18n';

export interface WritableFileStreamLike {
  write(data: Blob | BufferSource | string): Promise<void>;
  close(): Promise<void>;
}

export interface FileSystemFileHandleLike {
  getFile(): Promise<File>;
  createWritable(): Promise<WritableFileStreamLike>;
}

export interface FileSystemDirectoryHandleLike {
  name: string;
  getFileHandle(
    name: string,
    options?: { create?: boolean }
  ): Promise<FileSystemFileHandleLike>;
  getDirectoryHandle?(
    name: string,
    options?: { create?: boolean }
  ): Promise<FileSystemDirectoryHandleLike>;
}

interface WindowWithDirectoryPicker extends Window {
  showDirectoryPicker?: (options?: {
    mode?: 'read' | 'readwrite';
    id?: string;
    startIn?:
      | 'desktop'
      | 'documents'
      | 'downloads'
      | 'music'
      | 'pictures'
      | 'videos';
  }) => Promise<FileSystemDirectoryHandleLike>;
}

export const EXPORT_MANIFEST_FILE_NAME = '.dcm-jpeg-export-manifest.json';
export const EXPORT_REPORT_JSON_FILE_NAME = 'export-report.json';
export const EXPORT_REPORT_CSV_FILE_NAME = 'export-report.csv';

export function isDirectoryWriteSupported(): boolean {
  return typeof getDirectoryPicker() === 'function';
}

export async function requestExportDirectory(
  locale: Locale = getCurrentLocale()
): Promise<Result<FileSystemDirectoryHandleLike, AppError>> {
  const picker = getDirectoryPicker();

  if (!picker) {
    return err(
      createLocalizedAppError(
        locale,
        'ZIP_EXPORT_FAILED',
        'error.browserDoesNotSupportFolderExport'
      )
    );
  }

  try {
    return ok(await picker({ mode: 'readwrite', id: 'dcm-jpeg-export' }));
  } catch (cause) {
    return err(
      createLocalizedAppError(
        locale,
        'ZIP_EXPORT_FAILED',
        'error.chooseExportDirectoryFailed',
        undefined,
        { cause }
      )
    );
  }
}

export async function writeBlobToDirectory(
  directoryHandle: FileSystemDirectoryHandleLike,
  relativePath: string,
  blob: Blob,
  locale: Locale = getCurrentLocale()
): Promise<void> {
  const { directory, fileName } = await resolveDirectoryForRelativePath(
    directoryHandle,
    relativePath,
    locale,
    true
  );
  const fileHandle = await directory.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

export async function writeTextToDirectory(
  directoryHandle: FileSystemDirectoryHandleLike,
  fileName: string,
  value: string,
  locale: Locale = getCurrentLocale()
): Promise<void> {
  const blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
  await writeBlobToDirectory(directoryHandle, fileName, blob, locale);
}

export async function readTextFromDirectory(
  directoryHandle: FileSystemDirectoryHandleLike,
  relativePath: string
): Promise<string | undefined> {
  try {
    const { directory, fileName } = await resolveDirectoryForRelativePath(
      directoryHandle,
      relativePath,
      getCurrentLocale(),
      false
    );
    const fileHandle = await directory.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch {
    return undefined;
  }
}

function getDirectoryPicker(): WindowWithDirectoryPicker['showDirectoryPicker'] {
  return (window as WindowWithDirectoryPicker).showDirectoryPicker;
}

async function resolveDirectoryForRelativePath(
  rootDirectory: FileSystemDirectoryHandleLike,
  relativePath: string,
  locale: Locale,
  createDirectories: boolean
): Promise<{ directory: FileSystemDirectoryHandleLike; fileName: string }> {
  const parts = relativePath.split('/').filter(Boolean);
  const fileName = parts.at(-1);

  if (!fileName || parts.some((part) => part === '.' || part === '..')) {
    throw createLocalizedAppError(
      locale,
      'ZIP_EXPORT_FAILED',
      'error.invalidExportRelativePath'
    );
  }

  let directory = rootDirectory;
  for (const segment of parts.slice(0, -1)) {
    if (!directory.getDirectoryHandle) {
      throw createLocalizedAppError(
        locale,
        'ZIP_EXPORT_FAILED',
        'error.browserDoesNotSupportNestedDirectories'
      );
    }

    directory = createDirectories
      ? await directory.getDirectoryHandle(segment, { create: true })
      : await directory.getDirectoryHandle(segment);
  }

  return { directory, fileName };
}
