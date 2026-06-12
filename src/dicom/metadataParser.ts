import * as dicomParser from 'dicom-parser';

import { createAppError } from '@/utils/errors';
import type { AppError } from '@/utils/errors';
import type { Result } from '@/utils/result';
import { err, ok } from '@/utils/result';

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
  file: File
): Promise<Result<DicomMetadata, AppError>> {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    return parseDicomMetadataFromBytes(bytes);
  } catch (cause) {
    return err(
      createAppError('FILE_READ_FAILED', `Failed to read ${file.name}`, {
        cause
      })
    );
  }
}

export function parseDicomMetadataFromBytes(
  bytes: Uint8Array
): Result<DicomMetadata, AppError> {
  try {
    const dataSet = dicomParser.parseDicom(bytes) as DicomDataSet;
    return ok(buildMetadata(dataSet));
  } catch (cause) {
    return err(
      createAppError('DICOM_PARSE_FAILED', 'Failed to parse DICOM metadata', {
        cause
      })
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
  setIfDefined(metadata, 'patientName', readTextTag(dataSet, DICOM_TAGS.PATIENT_NAME, textDecoder));
  setIfDefined(metadata, 'patientId', readTextTag(dataSet, DICOM_TAGS.PATIENT_ID, textDecoder));
  setIfDefined(metadata, 'patientSex', readTextTag(dataSet, DICOM_TAGS.PATIENT_SEX, textDecoder));
  setIfDefined(metadata, 'patientAge', readTextTag(dataSet, DICOM_TAGS.PATIENT_AGE, textDecoder));
  setIfDefined(metadata, 'studyInstanceUID', readAsciiTag(dataSet, DICOM_TAGS.STUDY_INSTANCE_UID));
  setIfDefined(metadata, 'studyDate', readAsciiTag(dataSet, DICOM_TAGS.STUDY_DATE));
  setIfDefined(metadata, 'studyTime', readAsciiTag(dataSet, DICOM_TAGS.STUDY_TIME));
  setIfDefined(metadata, 'studyDescription', readTextTag(dataSet, DICOM_TAGS.STUDY_DESCRIPTION, textDecoder));
  setIfDefined(metadata, 'seriesInstanceUID', readAsciiTag(dataSet, DICOM_TAGS.SERIES_INSTANCE_UID));
  setIfDefined(metadata, 'seriesNumber', readNumber(dataSet, DICOM_TAGS.SERIES_NUMBER, textDecoder));
  setIfDefined(metadata, 'seriesDescription', readTextTag(dataSet, DICOM_TAGS.SERIES_DESCRIPTION, textDecoder));
  setIfDefined(metadata, 'modality', readAsciiTag(dataSet, DICOM_TAGS.MODALITY));
  setIfDefined(metadata, 'sopInstanceUID', readAsciiTag(dataSet, DICOM_TAGS.SOP_INSTANCE_UID));
  setIfDefined(metadata, 'instanceNumber', readNumber(dataSet, DICOM_TAGS.INSTANCE_NUMBER, textDecoder));
  setIfDefined(metadata, 'rows', readNumber(dataSet, DICOM_TAGS.ROWS, textDecoder));
  setIfDefined(metadata, 'columns', readNumber(dataSet, DICOM_TAGS.COLUMNS, textDecoder));
  setIfDefined(metadata, 'windowCenter', readNumber(dataSet, DICOM_TAGS.WINDOW_CENTER, textDecoder));
  setIfDefined(metadata, 'windowWidth', readNumber(dataSet, DICOM_TAGS.WINDOW_WIDTH, textDecoder));
  setIfDefined(metadata, 'rescaleSlope', readNumber(dataSet, DICOM_TAGS.RESCALE_SLOPE, textDecoder));
  setIfDefined(metadata, 'rescaleIntercept', readNumber(dataSet, DICOM_TAGS.RESCALE_INTERCEPT, textDecoder));
  setIfDefined(metadata, 'transferSyntaxUID', readAsciiTag(dataSet, DICOM_TAGS.TRANSFER_SYNTAX_UID));

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
