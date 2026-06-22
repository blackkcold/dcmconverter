import { initializeCornerstone } from '@/dicom/cornerstoneInit';
import { addFileToCornerstoneFileManager } from '@/dicom/dicomFileManager';
import type { AppError } from '@/utils/errors';
import { log } from '@/utils/logger';
import type { Result } from '@/utils/result';
import { err, ok } from '@/utils/result';
import { windowLevelToVoiRange } from '@/viewer/windowLevel';
import { createLocalizedAppError, getCurrentLocale, type Locale } from '@/i18n';

type RenderingEngineConstructor = new (id: string) => RenderingEngineLike;

interface RenderingEngineLike {
  enableElement(input: unknown): void;
  disableElement(viewportId: string): void;
  getViewport(viewportId: string): unknown;
  resize?(immediate?: boolean, keepCamera?: boolean): void;
  destroy(): void;
}

interface StackViewportLike {
  setStack(imageIds: string[], currentImageIdIndex?: number): void | Promise<void>;
  setProperties?(
    properties?: { voiRange?: { lower: number; upper: number } },
    suppressEvents?: boolean
  ): void;
  render(): void;
}

interface CoreModuleLike {
  RenderingEngine?: RenderingEngineConstructor;
  Enums?: {
    ViewportType?: {
      STACK?: string;
    };
  };
}

export interface ActiveViewportController {
  imageId: string;
  setWindowLevel(center: number, width: number): void;
  resize(): void;
  dispose(): void;
}

const ENGINE_ID = 'dicom-viewer-engine';
const VIEWPORT_ID = 'main-viewport';

let sharedEngine: RenderingEngineLike | undefined;
let sharedViewportId: string | undefined;
let sharedElement: HTMLDivElement | undefined;

export async function renderDicomFileToElement(
  file: File,
  element: HTMLDivElement,
  locale: Locale = getCurrentLocale(),
  onProgress?: (step: string) => void
): Promise<Result<ActiveViewportController, AppError>> {
  const initResult = await initializeCornerstone(locale);
  if (!initResult.ok) {
    return initResult;
  }

  onProgress?.('viewer.registeringFile');
  const imageIdResult = await addFileToCornerstoneFileManager(file, locale);
  if (!imageIdResult.ok) {
    return imageIdResult;
  }

  try {
    onProgress?.('viewer.creatingViewport');
    const core = (await import('@cornerstonejs/core')) as unknown as CoreModuleLike;
    const RenderingEngine = core.RenderingEngine;

    if (!RenderingEngine) {
      return err(
        createLocalizedAppError(
          locale,
          'VIEWPORT_INIT_FAILED',
          'error.cornerstoneRenderingEngineMissing'
        )
      );
    }

    const viewportType = core.Enums?.ViewportType?.STACK ?? 'stack';

    if (!sharedEngine) {
      sharedEngine = new RenderingEngine(ENGINE_ID);
      sharedViewportId = VIEWPORT_ID;
    }

    const viewportId = sharedViewportId!;
    const existingViewport = sharedEngine.getViewport(viewportId);

    if (!existingViewport || sharedElement !== element) {
      if (existingViewport) {
        sharedEngine.disableElement(viewportId);
      }

      sharedEngine.enableElement({
        viewportId,
        type: viewportType,
        element,
        defaultOptions: {
          background: [0, 0, 0]
        }
      });
      sharedElement = element;
    }

    const viewport = sharedEngine.getViewport(viewportId) as StackViewportLike;
    onProgress?.('viewer.decodingImage');
    await viewport.setStack([imageIdResult.value], 0);
    onProgress?.('viewer.renderingImage');
    viewport.render();

    return ok({
      imageId: imageIdResult.value,
      setWindowLevel: (center, width) => {
        viewport.setProperties?.(
          {
            voiRange: windowLevelToVoiRange({ center, width })
          },
          true
        );
        viewport.render();
      },
      resize: () => sharedEngine?.resize?.(true, true),
      dispose: () => {
        // Engine is reused across file switches; only destroy on app teardown.
      }
    });
  } catch (cause) {
    log({
      level: 'error',
      message: 'Failed to render DICOM viewport',
      context: {
        imageId: imageIdResult.value,
        cause
      }
    });

    return err(
      createLocalizedAppError(
        locale,
        'VIEWPORT_RENDER_FAILED',
        'error.failedToRenderViewport',
        undefined,
        { cause }
      )
    );
  }
}
