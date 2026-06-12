import { createAppError } from '@/utils/errors';
import type { AppError } from '@/utils/errors';
import type { Result } from '@/utils/result';
import { err, ok } from '@/utils/result';

export function encodeCanvasToJpeg(
  canvas: HTMLCanvasElement,
  quality: number
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

        resolve(ok(blob));
      },
      'image/jpeg',
      normalizedQuality
    );
  });
}
