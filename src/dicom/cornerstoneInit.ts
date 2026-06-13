import type { AppError } from '@/utils/errors';
import type { Result } from '@/utils/result';
import { err, ok } from '@/utils/result';
import { createLocalizedAppError, getCurrentLocale, type Locale } from '@/i18n';

type InitializableModule = {
  init?: (options?: unknown) => void | Promise<void>;
};

let initPromise: Promise<Result<void, AppError>> | undefined;

export function initializeCornerstone(
  locale: Locale = getCurrentLocale()
): Promise<Result<void, AppError>> {
  initPromise ??= doInitializeCornerstone(locale);
  return initPromise;
}

async function doInitializeCornerstone(
  locale: Locale
): Promise<Result<void, AppError>> {
  try {
    const [core, tools, dicomImageLoader] = await Promise.all([
      import('@cornerstonejs/core') as Promise<unknown>,
      import('@cornerstonejs/tools') as Promise<unknown>,
      import('@cornerstonejs/dicom-image-loader') as Promise<unknown>
    ]);

    await maybeInit(core);
    await maybeInit(tools);
    await maybeInit(dicomImageLoader, {
      maxWebWorkers: Math.max(1, Math.min(navigator.hardwareConcurrency || 1, 4))
    });

    return ok(undefined);
  } catch (cause) {
    initPromise = undefined;
    return err(
      createLocalizedAppError(
        locale,
        'VIEWPORT_INIT_FAILED',
        'error.cornerstoneInitializationFailed',
        undefined,
        { cause }
      )
    );
  }
}

async function maybeInit(module: unknown, options?: unknown): Promise<void> {
  const initializable = module as InitializableModule;
  if (typeof initializable.init === 'function') {
    await initializable.init(options);
  }
}
