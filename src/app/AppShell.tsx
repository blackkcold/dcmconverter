import { ExportPanel } from '@/components/export/ExportPanel';
import { JobProgressPanel } from '@/components/export/JobProgressPanel';
import { FileImportPanel } from '@/components/file-import/FileImportPanel';
import { MetadataPanel } from '@/components/metadata/MetadataPanel';
import { LocaleSwitcher } from '@/components/locale/LocaleSwitcher';
import { DicomStudyTree } from '@/components/study-tree/DicomStudyTree';
import { DicomViewport } from '@/components/viewer/DicomViewport';
import { ViewerToolbar } from '@/components/viewer/ViewerToolbar';
import { useTranslator } from '@/i18n';
import { useDicomStore } from '@/store/useDicomStore';

export function AppShell() {
  const { files, skippedFiles, studies } = useDicomStore();
  const t = useTranslator();

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>{t('app.title')}</h1>
          <p>{t('app.subtitle')}</p>
        </div>
        <div className="header-actions">
          <LocaleSwitcher />
          <div className="header-stats" aria-label={t('app.importStatus')}>
            <span>{t('app.files', { count: files.length })}</span>
            <span>{t('app.studies', { count: studies.length })}</span>
            <span>{t('app.skipped', { count: skippedFiles.length })}</span>
          </div>
        </div>
      </header>

      <section className="workspace-grid">
        <aside className="left-panel" aria-label={t('tree.heading')}>
          <FileImportPanel />
          <DicomStudyTree />
        </aside>

        <section className="viewer-panel" aria-label={t('viewer.ariaLabel')}>
          <ViewerToolbar />
          <DicomViewport />
        </section>

        <aside className="right-panel" aria-label={`${t('metadata.heading')} ${t('export.heading')}`}>
          <MetadataPanel />
          <ExportPanel />
          <JobProgressPanel />
        </aside>
      </section>

      <footer className="status-bar">
        {t('app.footerDisclaimer')}
      </footer>
    </main>
  );
}
