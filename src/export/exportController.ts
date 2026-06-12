import type { DicomMetadata } from '@/dicom/dicomTypes';
import { cloneCanvas } from '@/export/canvasRenderer';
import { renderOverlay } from '@/export/overlayRenderer';
import type { WindowLevel } from '@/viewer/viewerTypes';

import type { ExportOptions, JpegExportResult } from './exportTypes';
import { createJpegFileName } from './fileNamer';
import { encodeCanvasToJpeg } from './jpegEncoder';

export async function exportCanvasAsJpeg(params: {
  canvas: HTMLCanvasElement;
  fileId: string;
  metadata: DicomMetadata;
  options: ExportOptions;
  windowLevel?: WindowLevel;
  usedNames?: Set<string>;
}): Promise<JpegExportResult> {
  const canvas = cloneCanvas(params.canvas);
  const context = canvas.getContext('2d');

  if (params.options.includeOverlay && context) {
    renderOverlay(
      context,
      canvas.width,
      canvas.height,
      params.metadata,
      params.options,
      params.windowLevel
    );
  }

  const encoded = await encodeCanvasToJpeg(canvas, params.options.jpegQuality);
  if (!encoded.ok) {
    throw encoded.error;
  }

  return {
    fileName: createJpegFileName(
      params.metadata,
      params.fileId,
      params.usedNames ?? new Set(),
      params.options.includePersonalInfo
    ),
    blob: encoded.value,
    fileId: params.fileId
  };
}
