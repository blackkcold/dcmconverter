import type { DicomMetadata } from '@/dicom/dicomTypes';
import { createTranslator, getCurrentLocale, type Locale } from '@/i18n';
import type { WindowLevel } from '@/viewer/viewerTypes';

export interface JpegMetadataPayload {
  imageDescription: string | undefined;
  userComment: string | undefined;
}

export interface CreateJpegMetadataInput {
  metadata: DicomMetadata;
  windowLevel?: WindowLevel;
  burnedInAnnotation: boolean;
  locale?: Locale;
}

const JPEG_SOI = 0xffd8;
const APP1_MARKER = 0xe1;
const EXIF_HEADER = new Uint8Array([0x45, 0x78, 0x69, 0x66, 0x00, 0x00]);
const UTF8_COMMENT_PREFIX = new Uint8Array([
  0x55, 0x54, 0x46, 0x38, 0x00, 0x00, 0x00, 0x00
]);
const TIFF_HEADER_LENGTH = 8;
const IFD_ENTRY_SIZE = 12;
const MAX_APP1_PAYLOAD_LENGTH = 65_533;

export function createJpegMetadataPayload(
  input: CreateJpegMetadataInput
): JpegMetadataPayload {
  const { metadata, windowLevel, burnedInAnnotation } = input;
  const locale = input.locale ?? getCurrentLocale();
  const t = createTranslator(locale);
  const windowCenter = windowLevel?.center ?? metadata.windowCenter;
  const windowWidth = windowLevel?.width ?? metadata.windowWidth;

  return {
    imageDescription: buildImageDescription(
      t,
      metadata,
      windowCenter,
      windowWidth,
      burnedInAnnotation
    ),
    userComment: JSON.stringify(
      stripUndefined({
        schema: 'dicom-jpeg-meta/v1',
        source: {
          modality: metadata.modality,
          imageType: metadata.imageType,
          studyDateTime: formatStudyDateTime(metadata.studyDate, metadata.studyTime),
          seriesNumber: metadata.seriesNumber,
          instanceNumber: metadata.instanceNumber,
          seriesDescription: metadata.seriesDescription,
          protocolName: metadata.protocolName
        },
        image: {
          rows: metadata.rows,
          columns: metadata.columns,
          pixelSpacing: metadata.pixelSpacing,
          sliceThickness: metadata.sliceThickness,
          spacingBetweenSlices: metadata.spacingBetweenSlices
        },
        rendering: {
          windowCenter,
          windowWidth,
          rescaleIntercept: metadata.rescaleIntercept,
          rescaleSlope: metadata.rescaleSlope,
          rescaleType: metadata.rescaleType,
          burnedInAnnotation
        },
        device: {
          manufacturer: metadata.manufacturer,
          model: metadata.manufacturerModelName
        }
      })
    )
  };
}

export async function injectJpegExifMetadata(
  blob: Blob,
  payload: JpegMetadataPayload
): Promise<Blob> {
  const jpegBytes = await blobToBytes(blob);

  if (!isJpeg(jpegBytes)) {
    throw new Error('JPEG metadata can only be written to JPEG blobs');
  }

  const app1Segment = createExifApp1Segment(payload);
  const output = new Uint8Array(jpegBytes.length + app1Segment.length);
  output.set(jpegBytes.slice(0, 2), 0);
  output.set(app1Segment, 2);
  output.set(jpegBytes.slice(2), 2 + app1Segment.length);

  return new Blob([output], { type: blob.type || 'image/jpeg' });
}

async function blobToBytes(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === 'function') {
    return new Uint8Array(await blob.arrayBuffer());
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob'));
    reader.onload = () => {
      if (!(reader.result instanceof ArrayBuffer)) {
        reject(new Error('Failed to read blob as ArrayBuffer'));
        return;
      }

      resolve(new Uint8Array(reader.result));
    };
    reader.readAsArrayBuffer(blob);
  });
}

export function createExifApp1Segment(payload: JpegMetadataPayload): Uint8Array {
  const tiff = createTiffPayload(payload);
  const app1Payload = concatBytes(EXIF_HEADER, tiff);

  if (app1Payload.length > MAX_APP1_PAYLOAD_LENGTH) {
    throw new Error('JPEG EXIF metadata exceeds APP1 size limit');
  }

  const segment = new Uint8Array(app1Payload.length + 4);
  segment[0] = 0xff;
  segment[1] = APP1_MARKER;
  const segmentLength = app1Payload.length + 2;
  segment[2] = (segmentLength >> 8) & 0xff;
  segment[3] = segmentLength & 0xff;
  segment.set(app1Payload, 4);
  return segment;
}

function createTiffPayload(payload: JpegMetadataPayload): Uint8Array {
  const imageDescriptionBytes = payload.imageDescription
    ? nullTerminatedUtf8(payload.imageDescription)
    : undefined;
  const userCommentBytes = payload.userComment
    ? concatBytes(UTF8_COMMENT_PREFIX, utf8Bytes(payload.userComment))
    : undefined;

  const hasImageDescription = Boolean(imageDescriptionBytes);
  const hasUserComment = Boolean(userCommentBytes);

  if (!hasImageDescription && !hasUserComment) {
    throw new Error('JPEG EXIF metadata payload must have at least one field');
  }

  const ifd0EntryCount = hasImageDescription ? 1 : 0;
  const hasExifIfd = hasUserComment;
  const totalIfd0Entries = ifd0EntryCount + (hasExifIfd ? 1 : 0);

  const exifEntryCount = hasUserComment ? 1 : 0;
  const ifd0Offset = TIFF_HEADER_LENGTH;
  const ifd0Length = getIfdLength(totalIfd0Entries);
  const imageDescriptionOffset = ifd0Offset + ifd0Length;
  const exifIfdOffset = hasImageDescription
    ? imageDescriptionOffset + (imageDescriptionBytes?.length ?? 0)
    : imageDescriptionOffset;
  const exifIfdLength = getIfdLength(exifEntryCount);
  const userCommentOffset = exifIfdOffset + exifIfdLength;
  const totalLength = hasUserComment
    ? userCommentOffset + (userCommentBytes?.length ?? 0)
    : imageDescriptionOffset + (imageDescriptionBytes?.length ?? 0);

  const tiff = new Uint8Array(totalLength);
  const view = new DataView(tiff.buffer);

  writeTiffHeader(view, ifd0Offset);
  writeIfdEntryCount(view, ifd0Offset, totalIfd0Entries);

  let entryIndex = 0;
  if (imageDescriptionBytes) {
    writeIfdEntry(view, ifd0Offset, entryIndex, {
      tag: 0x010e,
      type: 2,
      count: imageDescriptionBytes.length,
      valueOffset: imageDescriptionOffset
    });
    tiff.set(imageDescriptionBytes, imageDescriptionOffset);
    entryIndex += 1;
  }

  if (userCommentBytes) {
    writeIfdEntry(view, ifd0Offset, entryIndex, {
      tag: 0x8769,
      type: 4,
      count: 1,
      valueOffset: exifIfdOffset
    });
    writeIfdEntryCount(view, exifIfdOffset, exifEntryCount);
    writeIfdEntry(view, exifIfdOffset, 0, {
      tag: 0x9286,
      type: 7,
      count: userCommentBytes.length,
      valueOffset: userCommentOffset
    });
    writeNextIfdOffset(view, exifIfdOffset, exifEntryCount, 0);
    tiff.set(userCommentBytes, userCommentOffset);
  }

  writeNextIfdOffset(view, ifd0Offset, totalIfd0Entries, 0);

  return tiff;
}

function buildImageDescription(
  t: ReturnType<typeof createTranslator>,
  metadata: DicomMetadata,
  windowCenter: number | undefined,
  windowWidth: number | undefined,
  burnedInAnnotation: boolean
): string {
  const parts = [
    t('overlay.imageDescriptionPrefix'),
    metadata.modality,
    formatKeyValue(t('overlay.series'), metadata.seriesNumber),
    formatKeyValue(t('overlay.instance'), metadata.instanceNumber),
    formatWindowLevel(t, windowCenter, windowWidth),
    formatKeyValue(t('metadata.sliceThickness'), formatWithUnit(metadata.sliceThickness, 'mm')),
    formatKeyValue(t('metadata.pixelSpacing'), formatPixelSpacing(metadata.pixelSpacing)),
    formatHuTransform(metadata),
    `OverlayBurnedIn=${burnedInAnnotation ? 'YES' : 'NO'}`
  ].filter((part): part is string => Boolean(part));

  return parts.join(' | ');
}

function formatWindowLevel(
  t: ReturnType<typeof createTranslator>,
  windowCenter: number | undefined,
  windowWidth: number | undefined
): string | undefined {
  if (windowCenter === undefined && windowWidth === undefined) {
    return undefined;
  }

  return `${t('overlay.windowLevel')}=${formatNumber(windowCenter)}/${formatNumber(windowWidth)}`;
}

function formatHuTransform(metadata: DicomMetadata): string | undefined {
  if (
    metadata.rescaleIntercept === undefined &&
    metadata.rescaleSlope === undefined &&
    metadata.rescaleType === undefined
  ) {
    return undefined;
  }

  const type = metadata.rescaleType ?? 'HU';
  return `${type}=${formatNumber(metadata.rescaleIntercept ?? 0)}+${formatNumber(
    metadata.rescaleSlope ?? 1
  )}*x`;
}

function formatPixelSpacing(value: [number, number] | undefined): string | undefined {
  return value ? `${formatNumber(value[0])}x${formatNumber(value[1])}` : undefined;
}

function formatWithUnit(value: number | undefined, unit: string): string | undefined {
  return value === undefined ? undefined : `${formatNumber(value)}${unit}`;
}

function formatKeyValue(
  key: string,
  value: string | number | undefined
): string | undefined {
  return value === undefined || value === '' ? undefined : `${key}=${value}`;
}

function formatStudyDateTime(
  studyDate: string | undefined,
  studyTime: string | undefined
): string | undefined {
  if (studyDate && studyTime) {
    return `${studyDate}T${studyTime}`;
  }

  return studyDate ?? studyTime;
}

function stripUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripUndefined);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, stripUndefined(item)])
    );
  }

  return value;
}

function formatNumber(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) {
    return 'unknown';
  }

  return Number(value.toFixed(6)).toString();
}

function writeTiffHeader(view: DataView, ifd0Offset: number): void {
  view.setUint8(0, 0x49);
  view.setUint8(1, 0x49);
  view.setUint16(2, 0x002a, true);
  view.setUint32(4, ifd0Offset, true);
}

function writeIfdEntryCount(view: DataView, ifdOffset: number, count: number): void {
  view.setUint16(ifdOffset, count, true);
}

function writeIfdEntry(
  view: DataView,
  ifdOffset: number,
  index: number,
  entry: { tag: number; type: number; count: number; valueOffset: number }
): void {
  const offset = ifdOffset + 2 + index * IFD_ENTRY_SIZE;
  view.setUint16(offset, entry.tag, true);
  view.setUint16(offset + 2, entry.type, true);
  view.setUint32(offset + 4, entry.count, true);
  view.setUint32(offset + 8, entry.valueOffset, true);
}

function writeNextIfdOffset(
  view: DataView,
  ifdOffset: number,
  entryCount: number,
  nextIfdOffset: number
): void {
  view.setUint32(ifdOffset + 2 + entryCount * IFD_ENTRY_SIZE, nextIfdOffset, true);
}

function getIfdLength(entryCount: number): number {
  return 2 + entryCount * IFD_ENTRY_SIZE + 4;
}

function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && ((bytes[0] ?? 0) << 8) + (bytes[1] ?? 0) === JPEG_SOI;
}

function nullTerminatedUtf8(value: string): Uint8Array {
  return concatBytes(utf8Bytes(value), new Uint8Array([0]));
}

function utf8Bytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;

  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }

  return output;
}
