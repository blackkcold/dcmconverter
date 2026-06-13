export interface ExportOptions {
  scope: 'current' | 'series' | 'all';
  exportMode: 'folder' | 'zip';
  exportPackageName: string;
  outputLayout:
    | 'dicomSmart'
    | 'metadataField'
    | 'flat'
    | 'series'
    | 'source'
    | 'seriesSource';
  metadataFolderField: MetadataFolderField;
  fileNameTemplateMode: FileNameTemplateMode;
  fileNameTemplatePreset: FileNameTemplatePreset;
  fileNameTemplateFields: ExportNamingFieldKey[];
  jpegQuality: number;
  includeOverlay: boolean;
  anonymizeOverlay: boolean;
  includePersonalInfo: boolean;
  patientOverrideEnabled: boolean;
  patientOverride: PatientMetadataOverride;
  includeJpegMetadata: boolean;
  overlayPosition: 'right' | 'bottom';
  useCurrentWindowLevel: boolean;
  batchSize: number;
  resumeMode: boolean;
}

export type MetadataFolderField =
  | 'seriesDescription'
  | 'protocolName'
  | 'instanceNumber';

export type FileNameTemplateMode = 'preset' | 'fields';

export type FileNameTemplatePreset = 'standard' | 'study' | 'series';

export type ExportNamingFieldKey =
  | 'studyDate'
  | 'studyDescription'
  | 'modality'
  | 'protocolName'
  | 'seriesNumber'
  | 'seriesDescription'
  | 'instanceNumber';

export interface PatientMetadataOverride {
  patientName?: string;
  patientSex?: string;
  patientAge?: string;
}

export interface ExportJob {
  id: string;
  fileId: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  batchIndex: number;
  outputFileName: string;
  outputRelativePath: string;
  sourceRelativePath: string;
  retryCount: number;
  metadataHash: string;
  optionsHash: string;
  startedAt?: string;
  finishedAt?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface JpegExportResult {
  fileName: string;
  blob: Blob;
  fileId: string;
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  scope: 'current',
  exportMode: 'folder',
  exportPackageName: 'dicom-jpeg-export',
  outputLayout: 'dicomSmart',
  metadataFolderField: 'seriesDescription',
  fileNameTemplateMode: 'preset',
  fileNameTemplatePreset: 'standard',
  fileNameTemplateFields: [
    'studyDate',
    'modality',
    'seriesNumber',
    'instanceNumber'
  ],
  jpegQuality: 0.92,
  includeOverlay: true,
  anonymizeOverlay: true,
  includePersonalInfo: true,
  patientOverrideEnabled: false,
  patientOverride: {},
  includeJpegMetadata: true,
  overlayPosition: 'right',
  useCurrentWindowLevel: true,
  batchSize: 25,
  resumeMode: true
};

export interface ExportManifest {
  version: 1;
  createdAt: string;
  updatedAt: string;
  datasetHash: string;
  optionsHash: string;
  jobs: ExportJob[];
}

export interface ExportReport {
  generatedAt: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  jobs: ExportJob[];
}
