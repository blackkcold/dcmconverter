export interface ExportOptions {
  scope: 'current' | 'series' | 'all';
  exportMode: 'folder' | 'zip';
  outputLayout: 'flat' | 'series' | 'source' | 'seriesSource';
  jpegQuality: number;
  includeOverlay: boolean;
  anonymizeOverlay: boolean;
  includePersonalInfo: boolean;
  overlayPosition: 'right' | 'bottom';
  useCurrentWindowLevel: boolean;
  batchSize: number;
  resumeMode: boolean;
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
  outputLayout: 'series',
  jpegQuality: 0.92,
  includeOverlay: true,
  anonymizeOverlay: true,
  includePersonalInfo: true,
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
