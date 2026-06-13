import type { AppError } from '@/utils/errors';
import type { Result } from '@/utils/result';
import { err, ok } from '@/utils/result';
import {
  createLocalizedAppError,
  getCurrentLocale,
  type Locale
} from '@/i18n';

import { injectJpegExifMetadata } from './jpegMetadata';
import type { JpegMetadataPayload } from './jpegMetadata';

export function encodeCanvasToJpeg(
  canvas: HTMLCanvasElement,
  quality: number,
  metadata?: JpegMetadataPayload,
  locale: Locale = getCurrentLocale()
): Promise<Result<Blob, AppError>> {
  const normalizedQuality = Math.min(Math.max(quality, 0.1), 1);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(
            err(
              createLocalizedAppError(
                locale,
                'JPEG_EXPORT_FAILED',
                'error.browserFailedToEncodeCanvasJpeg'
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
                createLocalizedAppError(
                  locale,
                  'JPEG_EXPORT_FAILED',
                  'error.browserEncodedJpegMetadataInjectionFailed',
                  undefined,
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
