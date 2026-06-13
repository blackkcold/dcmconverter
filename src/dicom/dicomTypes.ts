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
  specificCharacterSet?: string;
  studyInstanceUID?: string;
  studyDate?: string;
  studyTime?: string;
  studyDescription?: string;
  seriesInstanceUID?: string;
  seriesNumber?: number;
  seriesDescription?: string;
  protocolName?: string;
  modality?: string;
  imageType?: string[];
  sopInstanceUID?: string;
  instanceNumber?: number;
  rows?: number;
  columns?: number;
  windowCenter?: number;
  windowWidth?: number;
  rescaleSlope?: number;
  rescaleIntercept?: number;
  rescaleType?: string;
  sliceThickness?: number;
  spacingBetweenSlices?: number;
  pixelSpacing?: [number, number];
  manufacturer?: string;
  manufacturerModelName?: string;
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
  protocolName?: string;
  modality?: string;
  instances: DicomInstance[];
}

export interface DicomInstance {
  fileId: string;
  sopInstanceUID?: string;
  instanceNumber?: number;
  metadata: DicomMetadata;
}
