import { createAppError } from '@/utils/errors';
import type { AppError } from '@/utils/errors';
import type { Result } from '@/utils/result';
import { err, ok } from '@/utils/result';

type DicomImageLoaderModule = {
  wadouri?: {
    fileManager?: {
      add(file: File): string;
      remove?(imageId: string): void;
    };
  };
};

export async function addFileToCornerstoneFileManager(
  file: File
): Promise<Result<string, AppError>> {
  try {
    const loader = (await import('@cornerstonejs/dicom-image-loader')) as unknown as
      | DicomImageLoaderModule
      | undefined;
    const imageId = loader?.wadouri?.fileManager?.add(file);

    if (!imageId) {
      return err(
        createAppError(
          'DICOM_DECODE_FAILED',
          'Cornerstone file manager is not available'
        )
      );
    }

    return ok(imageId);
  } catch (cause) {
    return err(
      createAppError('DICOM_DECODE_FAILED', 'Failed to register DICOM file', {
        cause
      })
    );
  }
}
