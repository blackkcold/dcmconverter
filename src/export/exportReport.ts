import type { ExportJob, ExportReport } from './exportTypes';

export function createExportReport(jobs: readonly ExportJob[]): ExportReport {
  return {
    generatedAt: new Date().toISOString(),
    totalCount: jobs.length,
    successCount: jobs.filter((job) => job.status === 'success').length,
    failedCount: jobs.filter((job) => job.status === 'failed').length,
    skippedCount: jobs.filter((job) => job.status === 'skipped').length,
    jobs: jobs.map((job) => ({ ...job }))
  };
}

export function exportReportToCsv(report: ExportReport): string {
  const header = [
    'fileId',
    'status',
    'batchIndex',
    'outputFileName',
    'outputRelativePath',
    'startedAt',
    'finishedAt',
    'retryCount',
    'errorCode',
    'errorMessage'
  ];
  const rows = report.jobs.map((job) =>
    [
      job.fileId,
      job.status,
      String(job.batchIndex),
      job.outputFileName,
      job.outputRelativePath,
      job.startedAt ?? '',
      job.finishedAt ?? '',
      String(job.retryCount),
      job.errorCode ?? '',
      job.errorMessage ?? ''
    ].map(csvEscape)
  );

  return [header, ...rows].map((row) => row.join(',')).join('\n');
}

function csvEscape(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}
