import { zipSync } from 'fflate';
import type { Zippable } from 'fflate';

import type { AppError } from '@/utils/errors';
import type { Result } from '@/utils/result';
import { err, ok } from '@/utils/result';
import {
  createLocalizedAppError,
  getCurrentLocale,
  type Locale
} from '@/i18n';

import type { JpegExportResult } from './exportTypes';

export interface ZipFileEntry {
  fileName: string;
  blob: Blob;
}

export async function createZipFromJpegs(
  results: readonly JpegExportResult[],
  locale: Locale = getCurrentLocale()
): Promise<Result<Blob, AppError>> {
  return createZipFromFiles(
    results.map((result) => ({ fileName: result.fileName, blob: result.blob })),
    locale
  );
}

export async function createZipFromFiles(
  files: readonly ZipFileEntry[],
  locale: Locale = getCurrentLocale()
): Promise<Result<Blob, AppError>> {
  try {
    const entries: Zippable = {};

    for (const file of files) {
      const bytes = await blobToUint8Array(file.blob);
      entries[file.fileName] = file.fileName.toLowerCase().endsWith('.jpg')
        ? [bytes, { level: 0 as const }]
        : bytes;
    }

    const zipped = zipSync(entries, { level: 6 });
    return ok(new Blob([zipped], { type: 'application/zip' }));
  } catch (cause) {
    return err(
      createLocalizedAppError(
        locale,
        'ZIP_EXPORT_FAILED',
        'error.failedToCreateZipArchive',
        undefined,
        { cause }
      )
    );
  }
}

async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === 'function') {
    return new Uint8Array(await blob.arrayBuffer());
  }

  return new Uint8Array(await new Response(blob).arrayBuffer());
}
