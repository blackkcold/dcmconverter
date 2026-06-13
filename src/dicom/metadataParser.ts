import * as dicomParser from 'dicom-parser';

import { createAppError } from '@/utils/errors';
import type { AppError } from '@/utils/errors';
import type { Result } from '@/utils/result';
import { err, ok } from '@/utils/result';

import type { DicomMetadata } from './dicomTypes';
import { DICOM_TAGS } from './metadataMap';

interface DicomDataSet {
  string(tag: string): string | undefined;
  uint16(tag: string): number | undefined;
  int16(tag: string): number | undefined;
  floatString(tag: string): number | undefined;
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

  setIfDefined(metadata, 'imageType', readStringArray(dataSet, DICOM_TAGS.IMAGE_TYPE));
  setIfDefined(
    metadata,
    'manufacturer',
    normalizeDicomText(dataSet.string(DICOM_TAGS.MANUFACTURER))
  );
  setIfDefined(
    metadata,
    'patientName',
    normalizeDicomText(dataSet.string(DICOM_TAGS.PATIENT_NAME))
  );
  setIfDefined(
    metadata,
    'patientId',
    normalizeDicomText(dataSet.string(DICOM_TAGS.PATIENT_ID))
  );
  setIfDefined(
    metadata,
    'patientSex',
    normalizeDicomText(dataSet.string(DICOM_TAGS.PATIENT_SEX))
  );
  setIfDefined(
    metadata,
    'patientAge',
    normalizeDicomText(dataSet.string(DICOM_TAGS.PATIENT_AGE))
  );
  setIfDefined(
    metadata,
    'studyInstanceUID',
    normalizeDicomText(dataSet.string(DICOM_TAGS.STUDY_INSTANCE_UID))
  );
  setIfDefined(
    metadata,
    'studyDate',
    normalizeDicomText(dataSet.string(DICOM_TAGS.STUDY_DATE))
  );
  setIfDefined(
    metadata,
    'studyTime',
    normalizeDicomText(dataSet.string(DICOM_TAGS.STUDY_TIME))
  );
  setIfDefined(
    metadata,
    'studyDescription',
    normalizeDicomText(dataSet.string(DICOM_TAGS.STUDY_DESCRIPTION))
  );
  setIfDefined(
    metadata,
    'manufacturerModelName',
    normalizeDicomText(dataSet.string(DICOM_TAGS.MANUFACTURER_MODEL_NAME))
  );
  setIfDefined(
    metadata,
    'seriesInstanceUID',
    normalizeDicomText(dataSet.string(DICOM_TAGS.SERIES_INSTANCE_UID))
  );
  setIfDefined(metadata, 'seriesNumber', readNumber(dataSet, DICOM_TAGS.SERIES_NUMBER));
  setIfDefined(
    metadata,
    'seriesDescription',
    normalizeDicomText(dataSet.string(DICOM_TAGS.SERIES_DESCRIPTION))
  );
  setIfDefined(
    metadata,
    'protocolName',
    normalizeDicomText(dataSet.string(DICOM_TAGS.PROTOCOL_NAME))
  );
  setIfDefined(
    metadata,
    'modality',
    normalizeDicomText(dataSet.string(DICOM_TAGS.MODALITY))
  );
  setIfDefined(
    metadata,
    'sopInstanceUID',
    normalizeDicomText(dataSet.string(DICOM_TAGS.SOP_INSTANCE_UID))
  );
  setIfDefined(
    metadata,
    'instanceNumber',
    readNumber(dataSet, DICOM_TAGS.INSTANCE_NUMBER)
  );
  setIfDefined(
    metadata,
    'sliceThickness',
    readNumber(dataSet, DICOM_TAGS.SLICE_THICKNESS)
  );
  setIfDefined(
    metadata,
    'spacingBetweenSlices',
    readNumber(dataSet, DICOM_TAGS.SPACING_BETWEEN_SLICES)
  );
  setIfDefined(metadata, 'rows', readNumber(dataSet, DICOM_TAGS.ROWS));
  setIfDefined(metadata, 'columns', readNumber(dataSet, DICOM_TAGS.COLUMNS));
  setIfDefined(
    metadata,
    'pixelSpacing',
    readNumberPair(dataSet, DICOM_TAGS.PIXEL_SPACING)
  );
  setIfDefined(metadata, 'windowCenter', readNumber(dataSet, DICOM_TAGS.WINDOW_CENTER));
  setIfDefined(metadata, 'windowWidth', readNumber(dataSet, DICOM_TAGS.WINDOW_WIDTH));
  setIfDefined(metadata, 'rescaleSlope', readNumber(dataSet, DICOM_TAGS.RESCALE_SLOPE));
  setIfDefined(
    metadata,
    'rescaleIntercept',
    readNumber(dataSet, DICOM_TAGS.RESCALE_INTERCEPT)
  );
  setIfDefined(
    metadata,
    'rescaleType',
    normalizeDicomText(dataSet.string(DICOM_TAGS.RESCALE_TYPE))
  );
  setIfDefined(
    metadata,
    'transferSyntaxUID',
    normalizeDicomText(dataSet.string(DICOM_TAGS.TRANSFER_SYNTAX_UID))
  );

  return metadata;
}

function readNumber(dataSet: DicomDataSet, tag: string): number | undefined {
  const fromString = readNumberArray(dataSet, tag)[0];
  if (Number.isFinite(fromString)) {
    return fromString;
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
  return Number.isFinite(fromInt) ? fromInt : undefined;
}

function readNumberPair(
  dataSet: DicomDataSet,
  tag: string
): [number, number] | undefined {
  const values = readNumberArray(dataSet, tag);
  return values.length >= 2 && Number.isFinite(values[0]) && Number.isFinite(values[1])
    ? [values[0] as number, values[1] as number]
    : undefined;
}

function readNumberArray(dataSet: DicomDataSet, tag: string): number[] {
  return splitDicomValues(dataSet.string(tag))
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
}

function readStringArray(dataSet: DicomDataSet, tag: string): string[] | undefined {
  const values = splitDicomValues(dataSet.string(tag))
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
  const normalized = value?.replaceAll('^', ' ').trim();
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
