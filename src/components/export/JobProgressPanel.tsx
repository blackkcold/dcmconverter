import { useExportStore } from '@/store/useExportStore';
import type { ExportJob } from '@/export/exportTypes';
import { useTranslator } from '@/i18n';

type JobGroupKey = 'active' | 'failed' | 'skipped' | 'success';

interface JobGroup {
  key: JobGroupKey;
  titleKey: 'jobs.groupActive' | 'jobs.groupFailed' | 'jobs.groupSkipped' | 'jobs.groupSuccess';
  jobs: ExportJob[];
  defaultOpen: boolean;
}

export function JobProgressPanel() {
  const { jobs, completedCount, failedCount, skippedCount } = useExportStore();
  const t = useTranslator();
  const runningJob = jobs.find((job) => job.status === 'running');
  const totalBatches = jobs.length
    ? Math.max(...jobs.map((job) => job.batchIndex)) + 1
    : 0;
  const groups = createJobGroups(jobs);

  return (
    <section className="tool-section">
      <h2>{t('jobs.heading')}</h2>
      {jobs.length === 0 ? (
        <p className="empty-state">{t('jobs.emptyState')}</p>
      ) : (
        <>
          <p className="inline-status">
            {t('jobs.summary', {
              total: jobs.length,
              done: completedCount,
              failed: failedCount,
              skipped: skippedCount
            })}
          </p>
          {runningJob ? (
            <p className="inline-status">
              {t('jobs.runningBatch', {
                current: runningJob.batchIndex + 1,
                total: totalBatches,
                path: runningJob.outputRelativePath
              })}
            </p>
          ) : null}
          <div className="job-groups">
            {groups.map((group) => (
              <details key={group.key} open={group.defaultOpen}>
                <summary>
                  {t(group.titleKey)} ({group.jobs.length})
                </summary>
                {group.jobs.length === 0 ? (
                  <p className="empty-state">{t('jobs.emptyGroup')}</p>
                ) : (
                  <ul className="job-list">
                    {group.jobs.map((job) => (
                      <li key={job.id}>
                        <span>{job.outputRelativePath}</span>
                        <strong>{formatJobStatus(job.status, t)}</strong>
                        {job.errorMessage ? (
                          <small>{job.errorMessage}</small>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function createJobGroups(jobs: readonly ExportJob[]): JobGroup[] {
  return [
    {
      key: 'active',
      titleKey: 'jobs.groupActive',
      jobs: jobs.filter((job) => job.status === 'running' || job.status === 'pending'),
      defaultOpen: true
    },
    {
      key: 'failed',
      titleKey: 'jobs.groupFailed',
      jobs: jobs.filter((job) => job.status === 'failed'),
      defaultOpen: true
    },
    {
      key: 'skipped',
      titleKey: 'jobs.groupSkipped',
      jobs: jobs.filter((job) => job.status === 'skipped'),
      defaultOpen: true
    },
    {
      key: 'success',
      titleKey: 'jobs.groupSuccess',
      jobs: jobs.filter((job) => job.status === 'success'),
      defaultOpen: false
    }
  ];
}

function formatJobStatus(
  status: ExportJob['status'],
  t: ReturnType<typeof useTranslator>
): string {
  switch (status) {
    case 'pending':
      return t('jobs.statusPending');
    case 'running':
      return t('jobs.statusRunning');
    case 'success':
      return t('jobs.statusSuccess');
    case 'failed':
      return t('jobs.statusFailed');
    case 'skipped':
      return t('jobs.statusSkipped');
  }
}
