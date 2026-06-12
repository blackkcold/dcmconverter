import { useExportStore } from '@/store/useExportStore';
import type { ExportJob } from '@/export/exportTypes';

type JobGroupKey = 'active' | 'failed' | 'skipped' | 'success';

interface JobGroup {
  key: JobGroupKey;
  title: string;
  jobs: ExportJob[];
  defaultOpen: boolean;
}

export function JobProgressPanel() {
  const { jobs, completedCount, failedCount, skippedCount } = useExportStore();
  const runningJob = jobs.find((job) => job.status === 'running');
  const totalBatches = jobs.length
    ? Math.max(...jobs.map((job) => job.batchIndex)) + 1
    : 0;
  const groups = createJobGroups(jobs);

  return (
    <section className="tool-section">
      <h2>Jobs</h2>
      {jobs.length === 0 ? (
        <p className="empty-state">暂无导出任务。</p>
      ) : (
        <>
          <p className="inline-status">
            Total {jobs.length} · Done {completedCount} · Failed {failedCount} ·
            Skipped {skippedCount}
          </p>
          {runningJob ? (
            <p className="inline-status">
              Batch {runningJob.batchIndex + 1}/{totalBatches} ·{' '}
              {runningJob.sourceRelativePath}
            </p>
          ) : null}
          <div className="job-groups">
            {groups.map((group) => (
              <details key={group.key} open={group.defaultOpen}>
                <summary>
                  {group.title} ({group.jobs.length})
                </summary>
                {group.jobs.length === 0 ? (
                  <p className="empty-state">暂无</p>
                ) : (
                  <ul className="job-list">
                    {group.jobs.map((job) => (
                      <li key={job.id}>
                        <span>{job.outputRelativePath}</span>
                        <strong>{job.status}</strong>
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
      title: '运行中 / 待处理',
      jobs: jobs.filter((job) => job.status === 'running' || job.status === 'pending'),
      defaultOpen: true
    },
    {
      key: 'failed',
      title: '失败',
      jobs: jobs.filter((job) => job.status === 'failed'),
      defaultOpen: true
    },
    {
      key: 'skipped',
      title: '跳过',
      jobs: jobs.filter((job) => job.status === 'skipped'),
      defaultOpen: true
    },
    {
      key: 'success',
      title: '成功',
      jobs: jobs.filter((job) => job.status === 'success'),
      defaultOpen: false
    }
  ];
}
