export interface LocalDicomFile {
  id: string;
  file: File;
  name: string;
  size: number;
  relativePath: string;
  lastModified: number;
}

export interface SkippedFile {
  name: string;
  reason: string;
}

export interface FileIngestResult {
  files: LocalDicomFile[];
  skippedFiles: SkippedFile[];
}

export interface DicomMetadata {
  patientName?: string;
  patientId?: string;
  patientSex?: string;
  patientAge?: string;
  studyInstanceUID?: string;
  studyDate?: string;
  studyTime?: string;
  studyDescription?: string;
  seriesInstanceUID?: string;
  seriesNumber?: number;
  seriesDescription?: string;
  modality?: string;
  sopInstanceUID?: string;
  instanceNumber?: number;
  rows?: number;
  columns?: number;
  windowCenter?: number;
  windowWidth?: number;
  rescaleSlope?: number;
  rescaleIntercept?: number;
  transferSyntaxUID?: string;
}

export interface DicomStudy {
  studyInstanceUID: string;
  description?: string;
  date?: string;
  series: DicomSeries[];
}

export interface DicomSeries {
  seriesInstanceUID: string;
  seriesNumber?: number;
  description?: string;
  modality?: string;
  instances: DicomInstance[];
}

export interface DicomInstance {
  fileId: string;
  sopInstanceUID?: string;
  instanceNumber?: number;
  metadata: DicomMetadata;
}
