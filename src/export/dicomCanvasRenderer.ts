import type { Types } from '@cornerstonejs/core';

import { initializeCornerstone } from '@/dicom/cornerstoneInit';
import { addFileToCornerstoneFileManager } from '@/dicom/dicomFileManager';
import type { DicomMetadata, LocalDicomFile } from '@/dicom/dicomTypes';
import { createAppError } from '@/utils/errors';
import type { AppError } from '@/utils/errors';
import type { Result } from '@/utils/result';
import { err, ok } from '@/utils/result';
import { normalizeWindowLevel } from '@/viewer/windowLevel';
import type { WindowLevel } from '@/viewer/viewerTypes';

export interface RenderDicomToCanvasInput {
  localFile: LocalDicomFile;
  metadata: DicomMetadata;
  windowLevel?: WindowLevel;
}

export type DicomCanvasRenderer = (
  input: RenderDicomToCanvasInput
) => Promise<HTMLCanvasElement>;

export async function renderDicomFileToCanvas(
  input: RenderDicomToCanvasInput
): Promise<Result<HTMLCanvasElement, AppError>> {
  const initResult = await initializeCornerstone();
  if (!initResult.ok) {
    return initResult;
  }

  const imageIdResult = await addFileToCornerstoneFileManager(input.localFile.file);
  if (!imageIdResult.ok) {
    return imageIdResult;
  }

  const imageId = imageIdResult.value;

  try {
    const { imageLoader, cache } = await import('@cornerstonejs/core');
    const image = await imageLoader.loadImage(imageId);
    const canvas = renderCornerstoneImageToCanvas(
      image,
      input.metadata,
      input.windowLevel
    );

    try {
      cache.removeImageLoadObject(imageId, { force: true });
    } catch {
      // Cache cleanup is best-effort; export success should not depend on it.
    }

    return ok(canvas);
  } catch (cause) {
    return err(
      createAppError('DICOM_DECODE_FAILED', 'Failed to render DICOM image', {
        fileId: input.localFile.id,
        cause
      })
    );
  }
}

export async function defaultDicomCanvasRenderer(
  input: RenderDicomToCanvasInput
): Promise<HTMLCanvasElement> {
  const result = await renderDicomFileToCanvas(input);
  if (!result.ok) {
    throw result.error;
  }

  return result.value;
}

function renderCornerstoneImageToCanvas(
  image: Types.IImage,
  metadata: DicomMetadata,
  requestedWindowLevel?: WindowLevel
): HTMLCanvasElement {
  const width = metadata.columns ?? image.columns ?? image.width;
  const height = metadata.rows ?? image.rows ?? image.height;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw createAppError('JPEG_EXPORT_FAILED', 'Canvas 2D context is unavailable');
  }

  if (image.color || image.rgba || image.numberOfComponents >= 3) {
    drawColorImage(context, image, width, height);
    return canvas;
  }

  drawMonochromeImage(context, image, metadata, requestedWindowLevel, width, height);
  return canvas;
}

function drawColorImage(
  context: CanvasRenderingContext2D,
  image: Types.IImage,
  width: number,
  height: number
): void {
  try {
    const sourceCanvas = image.getCanvas();
    context.drawImage(sourceCanvas, 0, 0, width, height);
    return;
  } catch {
    // Fall through to direct RGB/RGBA buffer rendering.
  }

  const pixelData = image.getPixelData();
  const imageData = context.createImageData(width, height);
  const components = image.rgba ? 4 : 3;

  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 1) {
    const sourceIndex = pixelIndex * components;
    const targetIndex = pixelIndex * 4;
    imageData.data[targetIndex] = Number(pixelData[sourceIndex] ?? 0);
    imageData.data[targetIndex + 1] = Number(pixelData[sourceIndex + 1] ?? 0);
    imageData.data[targetIndex + 2] = Number(pixelData[sourceIndex + 2] ?? 0);
    imageData.data[targetIndex + 3] =
      components === 4 ? Number(pixelData[sourceIndex + 3] ?? 255) : 255;
  }

  context.putImageData(imageData, 0, 0);
}

function drawMonochromeImage(
  context: CanvasRenderingContext2D,
  image: Types.IImage,
  metadata: DicomMetadata,
  requestedWindowLevel: WindowLevel | undefined,
  width: number,
  height: number
): void {
  const pixelData = image.getPixelData();
  const imageData = context.createImageData(width, height);
  const slope = metadata.rescaleSlope ?? image.slope ?? 1;
  const intercept = metadata.rescaleIntercept ?? image.intercept ?? 0;
  const imageWindowLevel = normalizeWindowLevel(
    getFirstNumber(requestedWindowLevel?.center, metadata.windowCenter, image.windowCenter),
    getFirstNumber(requestedWindowLevel?.width, metadata.windowWidth, image.windowWidth)
  );
  const low = imageWindowLevel.center - imageWindowLevel.width / 2;
  const high = imageWindowLevel.center + imageWindowLevel.width / 2;
  const range = Math.max(1, high - low);

  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 1) {
    const storedValue = Number(pixelData[pixelIndex] ?? 0);
    const modalityValue = storedValue * slope + intercept;
    const normalized = Math.round(((modalityValue - low) / range) * 255);
    const clamped = clampToByte(image.invert ? 255 - normalized : normalized);
    const targetIndex = pixelIndex * 4;
    imageData.data[targetIndex] = clamped;
    imageData.data[targetIndex + 1] = clamped;
    imageData.data[targetIndex + 2] = clamped;
    imageData.data[targetIndex + 3] = 255;
  }

  context.putImageData(imageData, 0, 0);
}

function getFirstNumber(
  ...values: Array<number | number[] | undefined>
): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (Array.isArray(value) && typeof value[0] === 'number') {
      return value[0];
    }
  }

  return undefined;
}

function clampToByte(value: number): number {
  return Math.min(255, Math.max(0, value));
}
