import type { DicomMetadata } from '@/dicom/dicomTypes';
import { createTranslator, getCurrentLocale, type Locale } from '@/i18n';
import type { WindowLevel } from '@/viewer/viewerTypes';

import type { ExportOptions } from './exportTypes';

export interface OverlayLineGroup {
  anchor: 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom' | 'footer';
  lines: string[];
}

export function buildOverlayLineGroups(
  metadata: DicomMetadata,
  options: Pick<ExportOptions, 'anonymizeOverlay'> &
    Partial<Pick<ExportOptions, 'includePersonalInfo'>>,
  windowLevel?: WindowLevel,
  locale: Locale = getCurrentLocale()
): OverlayLineGroup[] {
  const t = createTranslator(locale);
  const shouldAnonymize = options.anonymizeOverlay && !options.includePersonalInfo;
  const patientName = shouldAnonymize
    ? t('overlay.anonymous')
    : metadata.patientName ?? t('overlay.unknown');
  const patientId = shouldAnonymize
    ? t('overlay.hidden')
    : metadata.patientId ?? t('overlay.unknown');

  return [
    {
      anchor: 'leftTop',
      lines: [
        `${t('overlay.patient')}: ${patientName}`,
        `${t('overlay.id')}: ${patientId}`,
        `${t('overlay.sexAge')}: ${metadata.patientSex ?? '?'} / ${metadata.patientAge ?? '?'}`
      ]
    },
    {
      anchor: 'leftBottom',
      lines: [
        `${t('overlay.study')}: ${metadata.studyDate ?? t('overlay.unknown')} ${metadata.studyTime ?? ''}`.trim(),
        metadata.studyDescription ?? t('overlay.noStudyDescription')
      ]
    },
    {
      anchor: 'rightTop',
      lines: [
        `${t('overlay.modality')}: ${metadata.modality ?? t('overlay.unknown')}`,
        `${t('overlay.series')}: ${metadata.seriesNumber ?? t('overlay.unknown')}`,
        `${t('overlay.instance')}: ${metadata.instanceNumber ?? t('overlay.unknown')}`
      ]
    },
    {
      anchor: 'rightBottom',
      lines: [
        `${t('overlay.windowLevel')}: ${windowLevel?.center ?? metadata.windowCenter ?? t('overlay.unknown')} / ${
          windowLevel?.width ?? metadata.windowWidth ?? t('overlay.unknown')
        }`,
        `${t('overlay.size')}: ${metadata.rows ?? '?'} x ${metadata.columns ?? '?'}`
      ]
    },
    {
      anchor: 'footer',
      lines: [t('overlay.nonDiagnosticWatermark')]
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
  windowLevel?: WindowLevel,
  locale: Locale = getCurrentLocale()
): void {
  const groups = buildOverlayLineGroups(metadata, options, windowLevel, locale);
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

export function getNonDiagnosticWatermark(locale: Locale = getCurrentLocale()): string {
  return createTranslator(locale)('overlay.nonDiagnosticWatermark');
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
