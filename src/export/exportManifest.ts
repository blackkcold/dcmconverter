import type { ExportJob, ExportManifest } from './exportTypes';
import {
  EXPORT_MANIFEST_FILE_NAME,
  readTextFromDirectory,
  writeTextToDirectory
} from './fileSystemAccess';
import type { FileSystemDirectoryHandleLike } from './fileSystemAccess';

export function createExportManifest(params: {
  datasetHash: string;
  optionsHash: string;
  jobs: ExportJob[];
  now?: string;
}): ExportManifest {
  const now = params.now ?? new Date().toISOString();

  return {
    version: 1,
    createdAt: now,
    updatedAt: now,
    datasetHash: params.datasetHash,
    optionsHash: params.optionsHash,
    jobs: params.jobs
  };
}

export async function readExportManifest(
  directoryHandle: FileSystemDirectoryHandleLike
): Promise<ExportManifest | undefined> {
  const raw = await readTextFromDirectory(directoryHandle, EXPORT_MANIFEST_FILE_NAME);
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as ExportManifest;
    return parsed.version === 1 ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export async function writeExportManifest(
  directoryHandle: FileSystemDirectoryHandleLike,
  manifest: ExportManifest
): Promise<void> {
  await writeTextToDirectory(
    directoryHandle,
    EXPORT_MANIFEST_FILE_NAME,
    JSON.stringify({ ...manifest, updatedAt: new Date().toISOString() }, null, 2)
  );
}

export function applyResumeManifest(
  jobs: readonly ExportJob[],
  manifest: ExportManifest | undefined,
  optionsHash: string
): ExportJob[] {
  if (!manifest || manifest.optionsHash !== optionsHash) {
    return jobs.map((job) => ({ ...job }));
  }

  const completedJobs = new Map(
    manifest.jobs
      .filter(
        (job) =>
          job.status === 'success' &&
          job.optionsHash === optionsHash &&
          job.outputRelativePath.length > 0
      )
      .map((job) => [job.fileId, job])
  );

  return jobs.map((job) => {
    const previous = completedJobs.get(job.fileId);
    if (!previous || previous.metadataHash !== job.metadataHash) {
      return { ...job };
    }

    return {
      ...job,
      status: 'skipped',
      outputFileName: previous.outputFileName,
      outputRelativePath: previous.outputRelativePath,
      ...(previous.startedAt ? { startedAt: previous.startedAt } : {}),
      ...(previous.finishedAt ? { finishedAt: previous.finishedAt } : {}),
      errorMessage: 'Skipped by resume manifest'
    };
  });
}
