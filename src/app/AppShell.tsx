import { useCallback, useEffect, useState } from 'react';

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

type WorkspaceTab = 'tree' | 'viewer' | 'right';

export function AppShell() {
  const { files, skippedFiles, studies } = useDicomStore();
  const t = useTranslator();

  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<WorkspaceTab>('viewer');
  const isDrawerLayout = useMediaQuery('(max-width: 1024px)');
  const isMobileLayout = useMediaQuery('(max-width: 768px)');
  const tabletDrawerOpen = leftPanelOpen && isDrawerLayout && !isMobileLayout;
  const overlayPanelOpen = tabletDrawerOpen || (isMobileLayout && activeMobileTab !== 'viewer');

  // Keyboard guard: suppress stack navigation when panel overlay is open
  useEffect(() => {
    if (overlayPanelOpen) {
      document.body.setAttribute('data-panel-open', '');
    } else {
      document.body.removeAttribute('data-panel-open');
    }
  }, [overlayPanelOpen]);

  const handleTabClick = useCallback((tab: WorkspaceTab) => {
    setActiveMobileTab(tab);
    setLeftPanelOpen(false);
  }, []);

  const handleToggleLeftPanel = useCallback(() => {
    setActiveMobileTab('viewer');
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
            aria-label={tabletDrawerOpen ? t('tabs.closePanel') : t('tabs.openPanel')}
          >
            {tabletDrawerOpen ? '\u2715' : '\u2630'}
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
        <aside
          className={getPanelClassName('left-panel', {
            isOpen: tabletDrawerOpen,
            isVisible: isMobileLayout && activeMobileTab === 'tree'
          })}
          aria-label={t('tree.heading')}
        >
          <FileImportPanel />
          <DicomStudyTree />
        </aside>

        <section className="viewer-panel" aria-label={t('viewer.ariaLabel')}>
          <ViewerToolbar />
          <DicomViewport />
        </section>

        <aside
          className={getPanelClassName('right-panel', {
            isVisible: isMobileLayout && activeMobileTab === 'right'
          })}
          aria-label={`${t('metadata.heading')} ${t('export.heading')}`}
        >
          <MetadataPanel />
          <ExportPanel />
          <JobProgressPanel />
        </aside>

        <div
          className={`panel-overlay${tabletDrawerOpen ? ' is-open' : ''}`}
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
          className={getBottomTabClassName('tree', activeMobileTab)}
          aria-pressed={activeMobileTab === 'tree'}
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
          className={getBottomTabClassName('viewer', activeMobileTab)}
          aria-pressed={activeMobileTab === 'viewer'}
          onClick={() => handleTabClick('viewer')}
        >
          <span className="bottom-tab-icon">{'\u25C9'}</span>
          <span>{t('tabs.viewer')}</span>
        </button>
        <button
          type="button"
          className={getBottomTabClassName('right', activeMobileTab)}
          aria-pressed={activeMobileTab === 'right'}
          onClick={() => handleTabClick('right')}
        >
          <span className="bottom-tab-icon">{'\u21E7'}</span>
          <span>{t('tabs.export')}</span>
        </button>
      </nav>
    </main>
  );
}

function getBottomTabClassName(tab: WorkspaceTab, activeTab: WorkspaceTab): string {
  return `bottom-tab-btn${tab === activeTab ? ' bottom-tab-btn--active' : ''}`;
}

function getPanelClassName(
  baseClassName: 'left-panel' | 'right-panel',
  options: { isOpen?: boolean; isVisible?: boolean }
): string {
  return [
    baseClassName,
    options.isOpen ? 'is-open' : '',
    options.isVisible ? 'is-visible' : ''
  ]
    .filter(Boolean)
    .join(' ');
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }

    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(query);
    const updateMatches = () => setMatches(mediaQuery.matches);

    updateMatches();
    mediaQuery.addEventListener('change', updateMatches);

    return () => mediaQuery.removeEventListener('change', updateMatches);
  }, [query]);

  return matches;
}
