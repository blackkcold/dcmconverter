import { useDicomStore } from '@/store/useDicomStore';

export function DicomStudyTree() {
  const { files, studies, activeFileId, setActiveFileId, skippedFiles } =
    useDicomStore();

  if (files.length === 0) {
    return (
      <section className="tool-section grow">
        <h2>Study Tree</h2>
        <p className="empty-state">选择 DICOM 文件后会在这里显示 Study/Series。</p>
      </section>
    );
  }

  return (
    <section className="tool-section grow">
      <h2>Study Tree</h2>
      <div className="study-tree">
        {studies.map((study) => (
          <details key={study.studyInstanceUID} open>
            <summary>{study.description ?? study.studyInstanceUID}</summary>
            {study.series.map((series) => (
              <details key={series.seriesInstanceUID} open>
                <summary>
                  {series.modality ?? 'Series'} {series.seriesNumber ?? ''}
                  <span className="count">{series.instances.length}</span>
                </summary>
                <ul>
                  {series.instances.map((instance) => (
                    <li key={instance.fileId}>
                      <button
                        type="button"
                        className={
                          activeFileId === instance.fileId ? 'tree-active' : ''
                        }
                        onClick={() => setActiveFileId(instance.fileId)}
                      >
                        Instance {instance.instanceNumber ?? instance.fileId}
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </details>
        ))}
      </div>
      {skippedFiles.length > 0 ? (
        <details className="skipped-files">
          <summary>Skipped files ({skippedFiles.length})</summary>
          <ul>
            {skippedFiles.map((file) => (
              <li key={`${file.name}:${file.reason}`}>
                {file.name}: {file.reason}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
