import { createAppError } from '@/utils/errors';
import type { AppError } from '@/utils/errors';
import type { Result } from '@/utils/result';
import { err, ok } from '@/utils/result';

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

export async function requestExportDirectory(): Promise<
  Result<FileSystemDirectoryHandleLike, AppError>
> {
  const picker = getDirectoryPicker();

  if (!picker) {
    return err(
      createAppError(
        'ZIP_EXPORT_FAILED',
        '当前浏览器不支持选择目标文件夹写入，请使用 ZIP 导出。'
      )
    );
  }

  try {
    return ok(await picker({ mode: 'readwrite', id: 'dcm-jpeg-export' }));
  } catch (cause) {
    return err(
      createAppError('ZIP_EXPORT_FAILED', '选择导出文件夹失败或已取消。', {
        cause
      })
    );
  }
}

export async function writeBlobToDirectory(
  directoryHandle: FileSystemDirectoryHandleLike,
  fileName: string,
  blob: Blob
): Promise<void> {
  const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

export async function writeTextToDirectory(
  directoryHandle: FileSystemDirectoryHandleLike,
  fileName: string,
  value: string
): Promise<void> {
  const blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
  await writeBlobToDirectory(directoryHandle, fileName, blob);
}

export async function readTextFromDirectory(
  directoryHandle: FileSystemDirectoryHandleLike,
  fileName: string
): Promise<string | undefined> {
  try {
    const fileHandle = await directoryHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch {
    return undefined;
  }
}

function getDirectoryPicker(): WindowWithDirectoryPicker['showDirectoryPicker'] {
  return (window as WindowWithDirectoryPicker).showDirectoryPicker;
}
