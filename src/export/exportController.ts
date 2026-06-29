import type { DicomMetadata } from '@/dicom/dicomTypes';
import { cloneCanvas } from '@/export/canvasRenderer';
import { renderOverlay } from '@/export/overlayRenderer';
import type { WindowLevel } from '@/viewer/viewerTypes';
import { getCurrentLocale, type Locale } from '@/i18n';

import { applyPatientOverride } from './effectiveMetadata';
import type { ExportOptions, JpegExportResult } from './exportTypes';
import { createJpegFileName } from './fileNamer';
import { encodeCanvasToJpeg } from './jpegEncoder';
import { createJpegMetadataPayload } from './jpegMetadata';

export async function exportCanvasAsJpeg(params: {
  canvas: HTMLCanvasElement;
  fileId: string;
  metadata: DicomMetadata;
  options: ExportOptions;
  windowLevel?: WindowLevel;
  usedNames?: Set<string>;
  locale?: Locale;
}): Promise<JpegExportResult> {
  const locale = params.locale ?? getCurrentLocale();
  const canvas = cloneCanvas(params.canvas);
  const context = canvas.getContext('2d');
  const metadata = applyPatientOverride(params.metadata, params.options);

  if (params.options.includeOverlay && context) {
    renderOverlay(
      context,
      canvas.width,
      canvas.height,
      metadata,
      params.options,
      params.windowLevel,
      locale
    );
  }

  const includeJpegDescription = params.options.includeJpegDescription;
  const includeJpegExtendedMetadata = params.options.includeJpegExtendedMetadata;

  const metadataPayload =
    includeJpegDescription || includeJpegExtendedMetadata
      ? createJpegMetadataPayload({
          metadata,
          burnedInAnnotation: params.options.includeOverlay,
          ...(params.windowLevel ? { windowLevel: params.windowLevel } : {}),
          locale
        })
      : undefined;

  const filteredPayload = metadataPayload
    ? {
        imageDescription: includeJpegDescription
          ? metadataPayload.imageDescription
          : undefined,
        userComment: includeJpegExtendedMetadata
          ? metadataPayload.userComment
          : undefined
      }
    : undefined;

  const encoded = await encodeCanvasToJpeg(
    canvas,
    params.options.jpegQuality,
    filteredPayload,
    locale
  );
  if (!encoded.ok) {
    throw encoded.error;
  }

  return {
    fileName: createJpegFileName(metadata, {
      fileNameTemplateMode: params.options.fileNameTemplateMode,
      fileNameTemplatePreset: params.options.fileNameTemplatePreset,
      fileNameTemplateFields: params.options.fileNameTemplateFields,
      usedNames: params.usedNames ?? new Set()
    }),
    blob: encoded.value,
    fileId: params.fileId
  };
}
