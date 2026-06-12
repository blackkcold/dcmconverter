import { initializeCornerstone } from '@/dicom/cornerstoneInit';
import { addFileToCornerstoneFileManager } from '@/dicom/dicomFileManager';
import { createAppError } from '@/utils/errors';
import type { AppError } from '@/utils/errors';
import type { Result } from '@/utils/result';
import { err, ok } from '@/utils/result';

type RenderingEngineConstructor = new (id: string) => RenderingEngineLike;

interface RenderingEngineLike {
  enableElement(input: unknown): void;
  getViewport(viewportId: string): unknown;
  destroy(): void;
}

interface StackViewportLike {
  setStack(imageIds: string[], activeImageId?: string): void | Promise<void>;
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
  dispose(): void;
}

let viewportSequence = 0;

export async function renderDicomFileToElement(
  file: File,
  element: HTMLDivElement
): Promise<Result<ActiveViewportController, AppError>> {
  const initResult = await initializeCornerstone();
  if (!initResult.ok) {
    return initResult;
  }

  const imageIdResult = await addFileToCornerstoneFileManager(file);
  if (!imageIdResult.ok) {
    return imageIdResult;
  }

  try {
    const core = (await import('@cornerstonejs/core')) as unknown as CoreModuleLike;
    const RenderingEngine = core.RenderingEngine;

    if (!RenderingEngine) {
      return err(
        createAppError('VIEWPORT_INIT_FAILED', 'Cornerstone RenderingEngine missing')
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
    await viewport.setStack([imageIdResult.value], imageIdResult.value);
    viewport.render();

    return ok({
      imageId: imageIdResult.value,
      dispose: () => renderingEngine.destroy()
    });
  } catch (cause) {
    return err(
      createAppError('VIEWPORT_RENDER_FAILED', 'Failed to render DICOM viewport', {
        cause
      })
    );
  }
}
