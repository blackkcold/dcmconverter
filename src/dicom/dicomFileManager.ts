import type { AppError } from '@/utils/errors';
import type { Result } from '@/utils/result';
import { err, ok } from '@/utils/result';
import { createLocalizedAppError, getCurrentLocale, type Locale } from '@/i18n';

type DicomImageLoaderModule = {
  wadouri?: {
    fileManager?: {
      add(file: File): string;
      remove?(imageId: string): void;
    };
  };
};

export async function addFileToCornerstoneFileManager(
  file: File,
  locale: Locale = getCurrentLocale()
): Promise<Result<string, AppError>> {
  try {
    const loader = (await import('@cornerstonejs/dicom-image-loader')) as unknown as
      | DicomImageLoaderModule
      | undefined;
    const imageId = loader?.wadouri?.fileManager?.add(file);

    if (!imageId) {
      return err(
        createLocalizedAppError(
          locale,
          'DICOM_DECODE_FAILED',
          'error.cornerstoneFileManagerUnavailable'
        )
      );
    }

    return ok(imageId);
  } catch (cause) {
    return err(
      createLocalizedAppError(
        locale,
        'DICOM_DECODE_FAILED',
        'error.failedToRegisterDicomFile',
        undefined,
        { cause }
      )
    );
  }
}
