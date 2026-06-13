import type { DicomMetadata } from '@/dicom/dicomTypes';

import type { ExportOptions, PatientMetadataOverride } from './exportTypes';

export function applyPatientOverride(
  metadata: DicomMetadata,
  options: Pick<ExportOptions, 'patientOverrideEnabled' | 'patientOverride'>
): DicomMetadata {
  if (!options.patientOverrideEnabled) {
    return metadata;
  }

  const override = normalizePatientOverride(options.patientOverride);
  if (Object.keys(override).length === 0) {
    return metadata;
  }

  return {
    ...metadata,
    ...override
  };
}

function normalizePatientOverride(
  override: PatientMetadataOverride
): PatientMetadataOverride {
  const normalized: PatientMetadataOverride = {};
  setIfNotBlank(normalized, 'patientName', override.patientName);
  setIfNotBlank(normalized, 'patientSex', override.patientSex);
  setIfNotBlank(normalized, 'patientAge', override.patientAge);
  return normalized;
}

function setIfNotBlank<K extends keyof PatientMetadataOverride>(
  target: PatientMetadataOverride,
  key: K,
  value: PatientMetadataOverride[K]
): void {
  const trimmed = value?.trim();
  if (trimmed) {
    target[key] = trimmed as PatientMetadataOverride[K];
  }
}
