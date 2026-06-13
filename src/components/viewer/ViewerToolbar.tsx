import { useActiveDicomMetadata } from '@/store/useDicomStore';
import { useTranslator } from '@/i18n';
import { useViewerStore } from '@/store/useViewerStore';
import { adjustWindowLevel, normalizeWindowLevel } from '@/viewer/windowLevel';

export function ViewerToolbar() {
  const metadata = useActiveDicomMetadata();
  const t = useTranslator();
  const {
    windowCenter,
    windowWidth,
    zoom,
    setWindowLevel,
    setZoom,
    resetViewport
  } = useViewerStore();
  const normalized = normalizeWindowLevel(
    windowCenter ?? metadata?.windowCenter,
    windowWidth ?? metadata?.windowWidth
  );

  return (
    <div className="viewer-toolbar" aria-label={t('viewer.ariaLabel')}>
      <button
        type="button"
        title={t('viewer.windowCenterDecrease')}
        onClick={() => {
          const next = adjustWindowLevel(normalized, -10, 0);
          setWindowLevel(next.center, next.width);
        }}
      >
        WC-
      </button>
      <button
        type="button"
        title={t('viewer.windowCenterIncrease')}
        onClick={() => {
          const next = adjustWindowLevel(normalized, 10, 0);
          setWindowLevel(next.center, next.width);
        }}
      >
        WC+
      </button>
      <button
        type="button"
        title={t('viewer.windowWidthDecrease')}
        onClick={() => {
          const next = adjustWindowLevel(normalized, 0, -20);
          setWindowLevel(next.center, next.width);
        }}
      >
        WW-
      </button>
      <button
        type="button"
        title={t('viewer.windowWidthIncrease')}
        onClick={() => {
          const next = adjustWindowLevel(normalized, 0, 20);
          setWindowLevel(next.center, next.width);
        }}
      >
        WW+
      </button>
      <button type="button" onClick={() => setZoom(zoom + 0.1)}>
        {t('viewer.zoomIncrease')}
      </button>
      <button type="button" onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}>
        {t('viewer.zoomDecrease')}
      </button>
      <button type="button" onClick={resetViewport}>
        {t('viewer.reset')}
      </button>
      <span
        aria-label={t('viewer.statusLine', {
          center: normalized.center,
          width: normalized.width,
          zoom: zoom.toFixed(1)
        })}
      >
        {t('viewer.statusLine', {
          center: normalized.center,
          width: normalized.width,
          zoom: zoom.toFixed(1)
        })}
      </span>
      <span className="toolbar-hint">{t('viewer.toolbarHint')}</span>
    </div>
  );
}
