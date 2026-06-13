import type {
  DicomInstance,
  DicomMetadata,
  DicomSeries,
  DicomStudy,
  LocalDicomFile
} from './dicomTypes';

export function groupDicomFiles(
  files: readonly LocalDicomFile[],
  metadataByFileId: Readonly<Record<string, DicomMetadata>>
): DicomStudy[] {
  const studies = new Map<string, DicomStudy>();

  for (const localFile of files) {
    const metadata = metadataByFileId[localFile.id] ?? {};
    const studyId = getStudyGroupingKey(metadata);
    const seriesId = getSeriesGroupingKey(metadata);

    let study = studies.get(studyId);
    if (!study) {
      study = {
        studyInstanceUID: studyId,
        ...(metadata.studyDescription
          ? { description: metadata.studyDescription }
          : {}),
        ...(metadata.studyDate ? { date: metadata.studyDate } : {}),
        series: []
      };
      studies.set(studyId, study);
    }

    let series = study.series.find((item) => item.seriesInstanceUID === seriesId);
    if (!series) {
      series = createSeries(seriesId, metadata);
      study.series.push(series);
    }

    series.instances.push(createInstance(localFile.id, metadata));
  }

  const result = Array.from(studies.values());
  result.forEach((study) => {
    study.series.sort(compareSeries);
    study.series.forEach((series) => series.instances.sort(compareInstances));
  });

  return result.sort((a, b) => a.studyInstanceUID.localeCompare(b.studyInstanceUID));
}

function createSeries(seriesInstanceUID: string, metadata: DicomMetadata): DicomSeries {
  return {
    seriesInstanceUID,
    ...(metadata.seriesNumber !== undefined
      ? { seriesNumber: metadata.seriesNumber }
      : {}),
    ...(metadata.seriesDescription ? { description: metadata.seriesDescription } : {}),
    ...(metadata.protocolName ? { protocolName: metadata.protocolName } : {}),
    ...(metadata.modality ? { modality: metadata.modality } : {}),
    instances: []
  };
}

function getStudyGroupingKey(metadata: DicomMetadata): string {
  if (metadata.studyInstanceUID) {
    return metadata.studyInstanceUID;
  }

  return [
    'study',
    metadata.studyDate ?? 'unknownDate',
    metadata.studyTime ?? 'unknownTime',
    metadata.studyDescription ?? 'unknownStudy',
    metadata.patientId ?? 'unknownPatient'
  ].join(':');
}

function getSeriesGroupingKey(metadata: DicomMetadata): string {
  if (metadata.seriesInstanceUID) {
    return metadata.seriesInstanceUID;
  }

  return [
    'series',
    metadata.seriesNumber ?? 'unknownNumber',
    metadata.modality ?? 'unknownModality',
    metadata.protocolName ?? 'unknownProtocol',
    metadata.seriesDescription ?? 'unknownDescription'
  ].join(':');
}

function createInstance(fileId: string, metadata: DicomMetadata): DicomInstance {
  return {
    fileId,
    ...(metadata.sopInstanceUID ? { sopInstanceUID: metadata.sopInstanceUID } : {}),
    ...(metadata.instanceNumber !== undefined
      ? { instanceNumber: metadata.instanceNumber }
      : {}),
    metadata
  };
}

function compareSeries(a: DicomSeries, b: DicomSeries): number {
  return (
    (a.seriesNumber ?? Number.MAX_SAFE_INTEGER) -
      (b.seriesNumber ?? Number.MAX_SAFE_INTEGER) ||
    a.seriesInstanceUID.localeCompare(b.seriesInstanceUID)
  );
}

function compareInstances(a: DicomInstance, b: DicomInstance): number {
  return (
    (a.instanceNumber ?? Number.MAX_SAFE_INTEGER) -
      (b.instanceNumber ?? Number.MAX_SAFE_INTEGER) || a.fileId.localeCompare(b.fileId)
  );
}
