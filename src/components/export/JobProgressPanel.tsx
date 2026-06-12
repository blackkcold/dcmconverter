import { useExportStore } from '@/store/useExportStore';

export function JobProgressPanel() {
  const { jobs, completedCount, failedCount, skippedCount } = useExportStore();
  const runningJob = jobs.find((job) => job.status === 'running');
  const totalBatches = jobs.length
    ? Math.max(...jobs.map((job) => job.batchIndex)) + 1
    : 0;

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
          <ul className="job-list">
            {jobs.map((job) => (
              <li key={job.id}>
                <span>{job.outputFileName}</span>
                <strong>{job.status}</strong>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
