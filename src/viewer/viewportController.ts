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

let viewportSequence = 0;

export async function renderDicomFileToElement(
  file: File,
  element: HTMLDivElement,
  locale: Locale = getCurrentLocale()
): Promise<Result<ActiveViewportController, AppError>> {
  const initResult = await initializeCornerstone(locale);
  if (!initResult.ok) {
    return initResult;
  }

  const imageIdResult = await addFileToCornerstoneFileManager(file, locale);
  if (!imageIdResult.ok) {
    return imageIdResult;
  }

  try {
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

    const renderingEngineId = `local-dicom-rendering-engine-${viewportSequence++}`;
    const viewportId = `local-dicom-viewport-${viewportSequence}`;
    const renderingEngine = new RenderingEngine(renderingEngineId);
    const viewportType = core.Enums?.ViewportType?.STACK ?? 'stack';

    renderingEngine.enableElement({
      viewportId,
      type: viewportType,
      element,
      defaultOptions: {
        background: [0, 0, 0]
      }
    });

    const viewport = renderingEngine.getViewport(viewportId) as StackViewportLike;
    await viewport.setStack([imageIdResult.value], 0);
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
      resize: () => renderingEngine.resize?.(true, true),
      dispose: () => renderingEngine.destroy()
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
