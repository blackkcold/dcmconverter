import { ExportPanel } from '@/components/export/ExportPanel';
import { JobProgressPanel } from '@/components/export/JobProgressPanel';
import { FileImportPanel } from '@/components/file-import/FileImportPanel';
import { MetadataPanel } from '@/components/metadata/MetadataPanel';
import { DicomStudyTree } from '@/components/study-tree/DicomStudyTree';
import { DicomViewport } from '@/components/viewer/DicomViewport';
import { ViewerToolbar } from '@/components/viewer/ViewerToolbar';
import { useDicomStore } from '@/store/useDicomStore';

export function AppShell() {
  const { files, skippedFiles, studies } = useDicomStore();

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>Local DICOM JPEG Tool</h1>
          <p>本地处理 · 默认匿名 · Non-diagnostic JPEG</p>
        </div>
        <div className="header-stats" aria-label="导入状态">
          <span>{files.length} files</span>
          <span>{studies.length} studies</span>
          <span>{skippedFiles.length} skipped</span>
        </div>
      </header>

      <section className="workspace-grid">
        <aside className="left-panel" aria-label="文件与序列">
          <FileImportPanel />
          <DicomStudyTree />
        </aside>

        <section className="viewer-panel" aria-label="影像查看">
          <ViewerToolbar />
          <DicomViewport />
        </section>

        <aside className="right-panel" aria-label="元数据与导出">
          <MetadataPanel />
          <ExportPanel />
          <JobProgressPanel />
        </aside>
      </section>

      <footer className="status-bar">
        JPEG 为当前窗宽窗位渲染结果，不等价于原始 DICOM，不用于诊断。
      </footer>
    </main>
  );
}
