import { useCallback, useEffect, useRef, useState } from 'react';

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

  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const activeTabRef = useRef<'tree' | 'viewer' | 'right'>('viewer');

  // Keyboard guard: suppress stack navigation when panel overlay is open
  useEffect(() => {
    if (leftPanelOpen) {
      document.body.setAttribute('data-panel-open', '');
    } else {
      document.body.removeAttribute('data-panel-open');
    }
  }, [leftPanelOpen]);

  const handleTabClick = useCallback((tab: 'tree' | 'viewer' | 'right') => {
    if (tab === activeTabRef.current) return;
    activeTabRef.current = tab;

    const leftPanel = document.querySelector<HTMLElement>('.left-panel');
    const rightPanel = document.querySelector<HTMLElement>('.right-panel');
    const tabBtns = document.querySelectorAll<HTMLElement>('.bottom-tab-btn');

    leftPanel?.classList.remove('is-visible');
    rightPanel?.classList.remove('is-visible');
    tabBtns.forEach((b) => b.classList.remove('bottom-tab-btn--active'));

    if (tab === 'tree') {
      leftPanel?.classList.add('is-visible');
      tabBtns[0]?.classList.add('bottom-tab-btn--active');
    } else if (tab === 'right') {
      rightPanel?.classList.add('is-visible');
      tabBtns[2]?.classList.add('bottom-tab-btn--active');
    } else {
      tabBtns[1]?.classList.add('bottom-tab-btn--active');
    }
  }, []);

  const handleToggleLeftPanel = useCallback(() => {
    setLeftPanelOpen((prev) => !prev);
  }, []);

  return (
    <main className="app-shell">
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="panel-toggle-btn"
            onClick={handleToggleLeftPanel}
            aria-label={leftPanelOpen ? t('tabs.closePanel') : t('tabs.openPanel')}
          >
            {leftPanelOpen ? '\u2715' : '\u2630'}
          </button>
          <div>
            <h1>{t('app.title')}</h1>
            <p>{t('app.subtitle')}</p>
          </div>
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
        <aside className={`left-panel${leftPanelOpen ? ' is-open' : ''}`} aria-label={t('tree.heading')}>
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

        <div
          className={`panel-overlay${leftPanelOpen ? ' is-open' : ''}`}
          onClick={() => setLeftPanelOpen(false)}
          aria-hidden="true"
        />
      </section>

      <footer className="status-bar">
        {t('app.footerDisclaimer')}
      </footer>

      <nav className="bottom-tab-bar" aria-label={t('tabs.navLabel')}>
        <button
          type="button"
          className="bottom-tab-btn"
          onClick={() => handleTabClick('tree')}
        >
          <span className="bottom-tab-icon">{'\u2630'}</span>
          <span>{t('tabs.tree')}</span>
          {files.length > 0 ? (
            <span className="bottom-tab-badge">{files.length}</span>
          ) : null}
        </button>
        <button
          type="button"
          className="bottom-tab-btn bottom-tab-btn--active"
          onClick={() => handleTabClick('viewer')}
        >
          <span className="bottom-tab-icon">{'\u25C9'}</span>
          <span>{t('tabs.viewer')}</span>
        </button>
        <button
          type="button"
          className="bottom-tab-btn"
          onClick={() => handleTabClick('right')}
        >
          <span className="bottom-tab-icon">{'\u21E7'}</span>
          <span>{t('tabs.export')}</span>
        </button>
      </nav>
    </main>
  );
}
