import { createAppError } from '@/utils/errors';
import type { AppError } from '@/utils/errors';
import type { Result } from '@/utils/result';
import { err, ok } from '@/utils/result';

import { injectJpegExifMetadata } from './jpegMetadata';
import type { JpegMetadataPayload } from './jpegMetadata';

export function encodeCanvasToJpeg(
  canvas: HTMLCanvasElement,
  quality: number,
  metadata?: JpegMetadataPayload
): Promise<Result<Blob, AppError>> {
  const normalizedQuality = Math.min(Math.max(quality, 0.1), 1);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(
            err(
              createAppError(
                'JPEG_EXPORT_FAILED',
                'Browser failed to encode canvas as JPEG'
              )
            )
          );
          return;
        }

        if (!metadata) {
          resolve(ok(blob));
          return;
        }

        injectJpegExifMetadata(blob, metadata)
          .then((value) => resolve(ok(value)))
          .catch((cause) =>
            resolve(
              err(
                createAppError(
                  'JPEG_EXPORT_FAILED',
                  'Browser encoded JPEG, but metadata injection failed',
                  { cause }
                )
              )
            )
          );
      },
      'image/jpeg',
      normalizedQuality
    );
  });
}
