import * as dicomParser from 'dicom-parser';

import type { AppError } from '@/utils/errors';
import type { Result } from '@/utils/result';
import { err, ok } from '@/utils/result';
import { createLocalizedAppError, getCurrentLocale, type Locale } from '@/i18n';

import type { DicomMetadata } from './dicomTypes';
import { DICOM_TAGS } from './metadataMap';

interface DicomDataSet {
  byteArray: Uint8Array;
  elements: Record<string, DicomElement | undefined>;
  string(tag: string): string | undefined;
  uint16(tag: string): number | undefined;
  int16(tag: string): number | undefined;
  floatString(tag: string): number | undefined;
}

interface DicomElement {
  dataOffset: number;
  length: number;
  vr?: string;
}

interface DicomTextDecoder {
  label: string;
  decode(bytes: Uint8Array): string;
}

export async function parseDicomMetadata(
  file: File,
  locale: Locale = getCurrentLocale()
): Promise<Result<DicomMetadata, AppError>> {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    return parseDicomMetadataFromBytes(bytes, locale);
  } catch (cause) {
    return err(
      createLocalizedAppError(
        locale,
        'FILE_READ_FAILED',
        'error.failedToReadFile',
        { name: file.name },
        { cause }
      )
    );
  }
}

export function parseDicomMetadataFromBytes(
  bytes: Uint8Array,
  locale: Locale = getCurrentLocale()
): Result<DicomMetadata, AppError> {
  try {
    const dataSet = dicomParser.parseDicom(bytes) as DicomDataSet;
    return ok(buildMetadata(dataSet));
  } catch (cause) {
    return err(
      createLocalizedAppError(
        locale,
        'DICOM_PARSE_FAILED',
        'error.failedToParseDicomMetadata',
        undefined,
        { cause }
      )
    );
  }
}

function buildMetadata(dataSet: DicomDataSet): DicomMetadata {
  const metadata: DicomMetadata = {};
  const specificCharacterSet = normalizeDicomText(
    readAsciiTag(dataSet, DICOM_TAGS.SPECIFIC_CHARACTER_SET)
  );
  const textDecoder = createDicomTextDecoder(specificCharacterSet);

  setIfDefined(metadata, 'specificCharacterSet', specificCharacterSet);
  setIfDefined(
    metadata,
    'imageType',
    readStringArray(dataSet, DICOM_TAGS.IMAGE_TYPE, textDecoder)
  );
  setIfDefined(
    metadata,
    'manufacturer',
    readTextTag(dataSet, DICOM_TAGS.MANUFACTURER, textDecoder)
  );
  setIfDefined(
    metadata,
    'patientName',
    readTextTag(dataSet, DICOM_TAGS.PATIENT_NAME, textDecoder)
  );
  setIfDefined(
    metadata,
    'patientId',
    readTextTag(dataSet, DICOM_TAGS.PATIENT_ID, textDecoder)
  );
  setIfDefined(
    metadata,
    'patientSex',
    readTextTag(dataSet, DICOM_TAGS.PATIENT_SEX, textDecoder)
  );
  setIfDefined(
    metadata,
    'patientAge',
    readTextTag(dataSet, DICOM_TAGS.PATIENT_AGE, textDecoder)
  );
  setIfDefined(
    metadata,
    'studyInstanceUID',
    readAsciiTag(dataSet, DICOM_TAGS.STUDY_INSTANCE_UID)
  );
  setIfDefined(metadata, 'studyDate', readAsciiTag(dataSet, DICOM_TAGS.STUDY_DATE));
  setIfDefined(metadata, 'studyTime', readAsciiTag(dataSet, DICOM_TAGS.STUDY_TIME));
  setIfDefined(
    metadata,
    'studyDescription',
    readTextTag(dataSet, DICOM_TAGS.STUDY_DESCRIPTION, textDecoder)
  );
  setIfDefined(
    metadata,
    'manufacturerModelName',
    readTextTag(dataSet, DICOM_TAGS.MANUFACTURER_MODEL_NAME, textDecoder)
  );
  setIfDefined(
    metadata,
    'seriesInstanceUID',
    readAsciiTag(dataSet, DICOM_TAGS.SERIES_INSTANCE_UID)
  );
  setIfDefined(
    metadata,
    'seriesNumber',
    readNumber(dataSet, DICOM_TAGS.SERIES_NUMBER, textDecoder)
  );
  setIfDefined(
    metadata,
    'seriesDescription',
    readTextTag(dataSet, DICOM_TAGS.SERIES_DESCRIPTION, textDecoder)
  );
  setIfDefined(
    metadata,
    'protocolName',
    readTextTag(dataSet, DICOM_TAGS.PROTOCOL_NAME, textDecoder)
  );
  setIfDefined(metadata, 'modality', readAsciiTag(dataSet, DICOM_TAGS.MODALITY));
  setIfDefined(
    metadata,
    'sopInstanceUID',
    readAsciiTag(dataSet, DICOM_TAGS.SOP_INSTANCE_UID)
  );
  setIfDefined(
    metadata,
    'instanceNumber',
    readNumber(dataSet, DICOM_TAGS.INSTANCE_NUMBER, textDecoder)
  );
  setIfDefined(
    metadata,
    'sliceThickness',
    readNumber(dataSet, DICOM_TAGS.SLICE_THICKNESS, textDecoder)
  );
  setIfDefined(
    metadata,
    'spacingBetweenSlices',
    readNumber(dataSet, DICOM_TAGS.SPACING_BETWEEN_SLICES, textDecoder)
  );
  setIfDefined(metadata, 'rows', readNumber(dataSet, DICOM_TAGS.ROWS, textDecoder));
  setIfDefined(
    metadata,
    'columns',
    readNumber(dataSet, DICOM_TAGS.COLUMNS, textDecoder)
  );
  setIfDefined(
    metadata,
    'pixelSpacing',
    readNumberPair(dataSet, DICOM_TAGS.PIXEL_SPACING, textDecoder)
  );
  setIfDefined(
    metadata,
    'windowCenter',
    readNumber(dataSet, DICOM_TAGS.WINDOW_CENTER, textDecoder)
  );
  setIfDefined(
    metadata,
    'windowWidth',
    readNumber(dataSet, DICOM_TAGS.WINDOW_WIDTH, textDecoder)
  );
  setIfDefined(
    metadata,
    'rescaleSlope',
    readNumber(dataSet, DICOM_TAGS.RESCALE_SLOPE, textDecoder)
  );
  setIfDefined(
    metadata,
    'rescaleIntercept',
    readNumber(dataSet, DICOM_TAGS.RESCALE_INTERCEPT, textDecoder)
  );
  setIfDefined(
    metadata,
    'rescaleType',
    readTextTag(dataSet, DICOM_TAGS.RESCALE_TYPE, textDecoder)
  );
  setIfDefined(
    metadata,
    'transferSyntaxUID',
    readAsciiTag(dataSet, DICOM_TAGS.TRANSFER_SYNTAX_UID)
  );

  return metadata;
}

function readNumber(
  dataSet: DicomDataSet,
  tag: string,
  textDecoder: DicomTextDecoder
): number | undefined {
  const vr = dataSet.elements[tag]?.vr;

  if (vr === 'DS' || vr === 'IS') {
    return parseDicomNumber(readTextTag(dataSet, tag, textDecoder));
  }

  if (vr === 'US') {
    const fromUint = dataSet.uint16(tag);
    return Number.isFinite(fromUint) ? fromUint : undefined;
  }

  if (vr === 'SS') {
    const fromInt = dataSet.int16(tag);
    return Number.isFinite(fromInt) ? fromInt : undefined;
  }

  const fromFloat = dataSet.floatString(tag);
  if (Number.isFinite(fromFloat)) {
    return fromFloat;
  }

  const fromUint = dataSet.uint16(tag);
  if (Number.isFinite(fromUint)) {
    return fromUint;
  }

  const fromInt = dataSet.int16(tag);
  if (Number.isFinite(fromInt)) {
    return fromInt;
  }

  return parseDicomNumber(readTextTag(dataSet, tag, textDecoder));
}

function readTextTag(
  dataSet: DicomDataSet,
  tag: string,
  textDecoder: DicomTextDecoder
): string | undefined {
  return normalizeDicomText(readRawString(dataSet, tag, textDecoder));
}

function readAsciiTag(dataSet: DicomDataSet, tag: string): string | undefined {
  return normalizeDicomText(
    readRawString(dataSet, tag, createDicomTextDecoder('ISO_IR 6'))
  );
}

function readRawString(
  dataSet: DicomDataSet,
  tag: string,
  textDecoder: DicomTextDecoder
): string | undefined {
  const element = dataSet.elements[tag];

  if (!element || element.length <= 0) {
    return dataSet.string(tag);
  }

  const start = element.dataOffset;
  const end = start + element.length;
  if (start < 0 || end > dataSet.byteArray.length) {
    return dataSet.string(tag);
  }

  return textDecoder.decode(dataSet.byteArray.slice(start, end));
}

function createDicomTextDecoder(
  specificCharacterSet: string | undefined
): DicomTextDecoder {
  const label = getTextDecoderLabel(specificCharacterSet);

  return {
    label,
    decode: (bytes) => decodeBytes(bytes, label)
  };
}

function getTextDecoderLabel(specificCharacterSet: string | undefined): string {
  const primaryCharacterSet = specificCharacterSet
    ?.split('\\')
    .at(0)
    ?.trim()
    .toUpperCase();

  if (!primaryCharacterSet || primaryCharacterSet === 'ISO_IR 6') {
    return 'iso-8859-1';
  }

  if (primaryCharacterSet === 'GB18030' || primaryCharacterSet === 'GBK') {
    return 'gb18030';
  }

  if (
    primaryCharacterSet === 'ISO_IR 192' ||
    primaryCharacterSet === 'ISO 2022 IR 192' ||
    primaryCharacterSet === 'UTF-8'
  ) {
    return 'utf-8';
  }

  if (
    primaryCharacterSet === 'ISO_IR 100' ||
    primaryCharacterSet === 'ISO 2022 IR 100'
  ) {
    return 'iso-8859-1';
  }

  return 'iso-8859-1';
}

function decodeBytes(bytes: Uint8Array, label: string): string {
  try {
    return new TextDecoder(label).decode(bytes);
  } catch {
    return new TextDecoder('iso-8859-1').decode(bytes);
  }
}

function parseDicomNumber(value: string | undefined): number | undefined {
  const firstValue = value?.split('\\').at(0)?.trim();
  if (!firstValue) {
    return undefined;
  }

  const parsed = Number(firstValue);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readNumberPair(
  dataSet: DicomDataSet,
  tag: string,
  textDecoder: DicomTextDecoder
): [number, number] | undefined {
  const values = readNumberArray(dataSet, tag, textDecoder);
  return values.length >= 2 && Number.isFinite(values[0]) && Number.isFinite(values[1])
    ? [values[0] as number, values[1] as number]
    : undefined;
}

function readNumberArray(
  dataSet: DicomDataSet,
  tag: string,
  textDecoder: DicomTextDecoder
): number[] {
  return splitDicomValues(readTextTag(dataSet, tag, textDecoder))
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
}

function readStringArray(
  dataSet: DicomDataSet,
  tag: string,
  textDecoder: DicomTextDecoder
): string[] | undefined {
  const values = splitDicomValues(readTextTag(dataSet, tag, textDecoder))
    .map(normalizeDicomText)
    .filter((value): value is string => value !== undefined);

  return values.length > 0 ? values : undefined;
}

function splitDicomValues(value: string | undefined): string[] {
  return (
    value
      ?.split('\\')
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

function normalizeDicomText(value: string | undefined): string | undefined {
  const normalized = value?.replaceAll('\0', '').replaceAll('^', ' ').trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
}

function setIfDefined<K extends keyof DicomMetadata>(
  metadata: DicomMetadata,
  key: K,
  value: DicomMetadata[K] | undefined
): void {
  if (value !== undefined) {
    metadata[key] = value;
  }
}
