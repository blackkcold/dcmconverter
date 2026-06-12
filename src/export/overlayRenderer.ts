import type { DicomMetadata } from '@/dicom/dicomTypes';
import type { WindowLevel } from '@/viewer/viewerTypes';

import type { ExportOptions } from './exportTypes';

export const NON_DIAGNOSTIC_WATERMARK =
  'Non-diagnostic JPEG · Exported from local DICOM tool';

export interface OverlayLineGroup {
  anchor: 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom' | 'footer';
  lines: string[];
}

export function buildOverlayLineGroups(
  metadata: DicomMetadata,
  options: Pick<ExportOptions, 'anonymizeOverlay'> &
    Partial<Pick<ExportOptions, 'includePersonalInfo'>>,
  windowLevel?: WindowLevel
): OverlayLineGroup[] {
  const shouldAnonymize = options.anonymizeOverlay && !options.includePersonalInfo;
  const patientName = shouldAnonymize
    ? 'Anonymous'
    : metadata.patientName ?? 'Unknown';
  const patientId = shouldAnonymize ? 'Hidden' : metadata.patientId ?? 'Unknown';

  return [
    {
      anchor: 'leftTop',
      lines: [
        `Patient: ${patientName}`,
        `ID: ${patientId}`,
        `Sex/Age: ${metadata.patientSex ?? '?'} / ${metadata.patientAge ?? '?'}`
      ]
    },
    {
      anchor: 'leftBottom',
      lines: [
        `Study: ${metadata.studyDate ?? 'unknown'} ${metadata.studyTime ?? ''}`.trim(),
        metadata.studyDescription ?? 'No study description'
      ]
    },
    {
      anchor: 'rightTop',
      lines: [
        `Modality: ${metadata.modality ?? 'unknown'}`,
        `Series: ${metadata.seriesNumber ?? 'unknown'}`,
        `Instance: ${metadata.instanceNumber ?? 'unknown'}`
      ]
    },
    {
      anchor: 'rightBottom',
      lines: [
        `WC/WW: ${windowLevel?.center ?? metadata.windowCenter ?? 'unknown'} / ${
          windowLevel?.width ?? metadata.windowWidth ?? 'unknown'
        }`,
        `Size: ${metadata.rows ?? '?'} x ${metadata.columns ?? '?'}`
      ]
    },
    {
      anchor: 'footer',
      lines: [NON_DIAGNOSTIC_WATERMARK]
    }
  ];
}

export function renderOverlay(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  metadata: DicomMetadata,
  options: Pick<ExportOptions, 'anonymizeOverlay'> &
    Partial<Pick<ExportOptions, 'includePersonalInfo'>>,
  windowLevel?: WindowLevel
): void {
  const groups = buildOverlayLineGroups(metadata, options, windowLevel);
  const margin = 16;
  const lineHeight = 18;

  context.save();
  context.font = '14px Arial, sans-serif';
  context.textBaseline = 'top';
  context.fillStyle = 'rgba(0, 0, 0, 0.55)';
  context.fillRect(0, 0, width, 56);
  context.fillRect(0, height - 64, width, 64);
  context.fillStyle = '#fff';

  for (const group of groups) {
    drawGroup(context, group, width, height, margin, lineHeight);
  }

  context.restore();
}

function drawGroup(
  context: CanvasRenderingContext2D,
  group: OverlayLineGroup,
  width: number,
  height: number,
  margin: number,
  lineHeight: number
): void {
  const maxChars = 42;
  const lines = group.lines.map((line) => truncate(line, maxChars));

  if (group.anchor === 'footer') {
    context.textAlign = 'center';
    context.fillText(lines[0] ?? '', width / 2, height - margin - lineHeight);
    return;
  }

  const x = group.anchor.startsWith('right') ? width - margin : margin;
  const y = group.anchor.endsWith('Bottom')
    ? height - margin - lineHeight * lines.length - 20
    : margin;

  context.textAlign = group.anchor.startsWith('right') ? 'right' : 'left';
  lines.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight);
  });
}

function truncate(value: string, maxChars: number): string {
  return value.length <= maxChars ? value : `${value.slice(0, maxChars - 1)}…`;
}
