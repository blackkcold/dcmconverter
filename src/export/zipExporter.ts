import { zipSync } from 'fflate';
import type { Zippable } from 'fflate';

import { createAppError } from '@/utils/errors';
import type { AppError } from '@/utils/errors';
import type { Result } from '@/utils/result';
import { err, ok } from '@/utils/result';

import type { JpegExportResult } from './exportTypes';

export interface ZipFileEntry {
  fileName: string;
  blob: Blob;
}

export async function createZipFromJpegs(
  results: readonly JpegExportResult[]
): Promise<Result<Blob, AppError>> {
  return createZipFromFiles(
    results.map((result) => ({ fileName: result.fileName, blob: result.blob }))
  );
}

export async function createZipFromFiles(
  files: readonly ZipFileEntry[]
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
      createAppError('ZIP_EXPORT_FAILED', 'Failed to create ZIP archive', { cause })
    );
  }
}

async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === 'function') {
    return new Uint8Array(await blob.arrayBuffer());
  }

  return new Uint8Array(await new Response(blob).arrayBuffer());
}
