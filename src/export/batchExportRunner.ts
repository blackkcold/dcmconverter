import type { DicomMetadata, LocalDicomFile } from '@/dicom/dicomTypes';
import { applyPatientOverride } from '@/export/effectiveMetadata';
import { renderOverlay } from '@/export/overlayRenderer';
import { createAppError } from '@/utils/errors';
import { normalizeWindowLevel } from '@/viewer/windowLevel';
import type { WindowLevel } from '@/viewer/viewerTypes';

import { buildExportJobs, splitIntoBatches } from './exportJobBuilder';
import {
  applyResumeManifest,
  createExportManifest,
  readExportManifest,
  writeExportManifest
} from './exportManifest';
import { createExportReport, exportReportToCsv } from './exportReport';
import type {
  ExportJob,
  ExportManifest,
  ExportOptions,
  JpegExportResult
} from './exportTypes';
import {
  EXPORT_REPORT_CSV_FILE_NAME,
  EXPORT_REPORT_JSON_FILE_NAME,
  writeBlobToDirectory,
  writeTextToDirectory
} from './fileSystemAccess';
import type { FileSystemDirectoryHandleLike } from './fileSystemAccess';
import { encodeCanvasToJpeg } from './jpegEncoder';
import { createJpegMetadataPayload } from './jpegMetadata';
import { createZipFromFiles } from './zipExporter';
import { defaultDicomCanvasRenderer } from './dicomCanvasRenderer';
import type { DicomCanvasRenderer } from './dicomCanvasRenderer';
import type { DicomStudy } from '@/dicom/dicomTypes';

export type BatchExportRunMode = 'all' | 'failed';

export interface BatchExportRunnerParams {
  files: readonly LocalDicomFile[];
  studies: readonly DicomStudy[];
  metadataByFileId: Readonly<Record<string, DicomMetadata>>;
  activeFileId?: string;
  options: ExportOptions;
  directoryHandle?: FileSystemDirectoryHandleLike;
  currentWindowLevel?: WindowLevel;
  previousJobs?: readonly ExportJob[];
  mode?: BatchExportRunMode;
  renderer?: DicomCanvasRenderer;
  onJobsChange?: (jobs: ExportJob[]) => void;
  onMessage?: (message: string) => void;
}

export interface BatchExportResult {
  jobs: ExportJob[];
  zipBlob?: Blob;
  reportJson: string;
  reportCsv: string;
}

export class SerialBatchExportRunner {
  private cancelled = false;
  private paused = false;
  private resumeWaiters: Array<() => void> = [];

  constructor(private readonly params: BatchExportRunnerParams) {}

  pause(): void {
    this.paused = true;
    this.params.onMessage?.('已请求暂停，当前文件完成后暂停。');
  }

  resume(): void {
    this.paused = false;
    this.resumeWaiters.splice(0).forEach((resolve) => resolve());
    this.params.onMessage?.('继续导出。');
  }

  cancel(): void {
    this.cancelled = true;
    this.resume();
    this.params.onMessage?.('已取消后续导出，已完成文件保留。');
  }

  async run(): Promise<BatchExportResult> {
    const { jobs, datasetHash, optionsHash } = await this.prepareJobs();
    const manifest = createExportManifest({ datasetHash, optionsHash, jobs });
    const zipResults: JpegExportResult[] = [];

    this.emitJobs(jobs);
    await this.writeManifestIfNeeded(manifest);

    const batches = splitIntoBatches(jobs, this.params.options.batchSize);

    for (const batch of batches) {
      for (const job of batch) {
        await this.waitIfPaused();

        if (this.cancelled) {
          await this.writeFinalArtifacts(jobs);
          return this.createResult(jobs, zipResults);
        }

        if (job.status === 'skipped') {
          this.emitJobs(jobs);
          continue;
        }

        await this.runSingleJob(job, jobs, zipResults, manifest);
      }
    }

    await this.writeFinalArtifacts(jobs);
    return this.createResult(jobs, zipResults);
  }

  private async prepareJobs(): Promise<{
    jobs: ExportJob[];
    datasetHash: string;
    optionsHash: string;
  }> {
    const built = buildExportJobs(this.params);
    const manifest =
      this.params.options.exportMode === 'folder' &&
      this.params.options.resumeMode &&
      this.params.directoryHandle
        ? await readExportManifest(this.params.directoryHandle)
        : undefined;
    const resumedJobs = applyResumeManifest(built.jobs, manifest, built.optionsHash);

    if (this.params.mode !== 'failed') {
      return { ...built, jobs: resumedJobs };
    }

    const failedFileIds = new Set(
      this.params.previousJobs
        ?.filter((job) => job.status === 'failed')
        .map((job) => job.fileId) ?? []
    );

    return {
      ...built,
      jobs: resumedJobs
        .filter((job) => failedFileIds.has(job.fileId))
        .map((job) => ({
          ...job,
          status: 'pending',
          retryCount:
            (this.params.previousJobs?.find(
              (previous) => previous.fileId === job.fileId
            )?.retryCount ?? 0) + 1
        }))
    };
  }

  private async runSingleJob(
    job: ExportJob,
    jobs: ExportJob[],
    zipResults: JpegExportResult[],
    manifest: ExportManifest
  ): Promise<void> {
    const localFile = this.params.files.find((file) => file.id === job.fileId);
    const metadata = applyPatientOverride(
      this.params.metadataByFileId[job.fileId] ?? {},
      this.params.options
    );
    const startedAt = new Date().toISOString();

    if (!localFile) {
      this.updateJob(jobs, job.id, {
        status: 'failed',
        startedAt,
        finishedAt: new Date().toISOString(),
        errorCode: 'FILE_READ_FAILED',
        errorMessage: 'Source file is missing from the current session'
      });
      await this.syncManifest(jobs, manifest);
      return;
    }

    this.updateJob(jobs, job.id, { status: 'running', startedAt });

    try {
      const windowLevel = this.resolveWindowLevel(metadata);
      const renderer = this.params.renderer ?? defaultDicomCanvasRenderer;
      const canvas = await renderer({ localFile, metadata, windowLevel });
      const context = canvas.getContext('2d');

      if (this.params.options.includeOverlay && context) {
        renderOverlay(
          context,
          canvas.width,
          canvas.height,
          metadata,
          this.params.options,
          windowLevel
        );
      }

      const encoded = await encodeCanvasToJpeg(
        canvas,
        this.params.options.jpegQuality,
        this.params.options.includeJpegMetadata
          ? createJpegMetadataPayload({
              metadata,
              windowLevel,
              burnedInAnnotation: this.params.options.includeOverlay
            })
          : undefined
      );

      if (!encoded.ok) {
        throw encoded.error;
      }

      if (this.params.options.exportMode === 'folder') {
        if (!this.params.directoryHandle) {
          throw createAppError('ZIP_EXPORT_FAILED', 'Missing export directory handle');
        }

        await writeBlobToDirectory(
          this.params.directoryHandle,
          job.outputRelativePath,
          encoded.value
        );
      } else {
        zipResults.push({
          fileId: job.fileId,
          fileName: job.outputRelativePath,
          blob: encoded.value
        });
      }

      this.updateJob(jobs, job.id, {
        status: 'success',
        finishedAt: new Date().toISOString()
      });
    } catch (error) {
      const appError =
        typeof error === 'object' && error !== null && 'code' in error
          ? (error as { code: string; message: string })
          : undefined;

      this.updateJob(jobs, job.id, {
        status: 'failed',
        finishedAt: new Date().toISOString(),
        errorCode: appError?.code ?? 'JPEG_EXPORT_FAILED',
        errorMessage:
          appError?.message ??
          (error instanceof Error ? error.message : 'Export failed')
      });
    }

    await this.syncManifest(jobs, manifest);
  }

  private resolveWindowLevel(metadata: DicomMetadata): WindowLevel {
    if (this.params.options.useCurrentWindowLevel && this.params.currentWindowLevel) {
      return this.params.currentWindowLevel;
    }

    return normalizeWindowLevel(metadata.windowCenter, metadata.windowWidth);
  }

  private async writeManifestIfNeeded(manifest: ExportManifest): Promise<void> {
    if (this.params.options.exportMode === 'folder' && this.params.directoryHandle) {
      await writeExportManifest(this.params.directoryHandle, manifest);
    }
  }

  private async syncManifest(
    jobs: ExportJob[],
    manifest: ExportManifest
  ): Promise<void> {
    manifest.jobs = jobs.map((job) => ({ ...job }));
    await this.writeManifestIfNeeded(manifest);
  }

  private async writeFinalArtifacts(jobs: ExportJob[]): Promise<void> {
    if (this.params.options.exportMode !== 'folder' || !this.params.directoryHandle) {
      return;
    }

    const report = createExportReport(jobs);
    await writeTextToDirectory(
      this.params.directoryHandle,
      EXPORT_REPORT_JSON_FILE_NAME,
      JSON.stringify(report, null, 2)
    );
    await writeTextToDirectory(
      this.params.directoryHandle,
      EXPORT_REPORT_CSV_FILE_NAME,
      exportReportToCsv(report)
    );
  }

  private async createResult(
    jobs: ExportJob[],
    zipResults: JpegExportResult[]
  ): Promise<BatchExportResult> {
    const report = createExportReport(jobs);
    const reportJson = JSON.stringify(report, null, 2);
    const reportCsv = exportReportToCsv(report);

    if (this.params.options.exportMode !== 'zip') {
      return { jobs, reportJson, reportCsv };
    }

    const zip = await createZipFromFiles([
      ...zipResults.map((result) => ({
        fileName: result.fileName,
        blob: result.blob
      })),
      {
        fileName: EXPORT_REPORT_JSON_FILE_NAME,
        blob: new Blob([reportJson], { type: 'application/json' })
      },
      {
        fileName: EXPORT_REPORT_CSV_FILE_NAME,
        blob: new Blob([reportCsv], { type: 'text/csv;charset=utf-8' })
      }
    ]);

    if (!zip.ok) {
      throw zip.error;
    }

    return { jobs, zipBlob: zip.value, reportJson, reportCsv };
  }

  private updateJob(jobs: ExportJob[], jobId: string, patch: Partial<ExportJob>): void {
    const index = jobs.findIndex((job) => job.id === jobId);
    if (index < 0) {
      return;
    }

    const current = jobs[index];
    if (!current) {
      return;
    }

    jobs[index] = { ...current, ...patch };
    this.emitJobs(jobs);
  }

  private emitJobs(jobs: ExportJob[]): void {
    this.params.onJobsChange?.(jobs.map((job) => ({ ...job })));
  }

  private async waitIfPaused(): Promise<void> {
    if (!this.paused) {
      return;
    }

    await new Promise<void>((resolve) => {
      this.resumeWaiters.push(resolve);
    });
  }
}
