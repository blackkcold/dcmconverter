import { useActiveDicomMetadata } from '@/store/useDicomStore';
import { useViewerStore } from '@/store/useViewerStore';
import { adjustWindowLevel, normalizeWindowLevel } from '@/viewer/windowLevel';

export function ViewerToolbar() {
  const metadata = useActiveDicomMetadata();
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
    <div className="viewer-toolbar" aria-label="Viewer controls">
      <button
        type="button"
        title="窗位 -10"
        onClick={() => {
          const next = adjustWindowLevel(normalized, -10, 0);
          setWindowLevel(next.center, next.width);
        }}
      >
        WC-
      </button>
      <button
        type="button"
        title="窗位 +10"
        onClick={() => {
          const next = adjustWindowLevel(normalized, 10, 0);
          setWindowLevel(next.center, next.width);
        }}
      >
        WC+
      </button>
      <button
        type="button"
        title="窗宽 -20"
        onClick={() => {
          const next = adjustWindowLevel(normalized, 0, -20);
          setWindowLevel(next.center, next.width);
        }}
      >
        WW-
      </button>
      <button
        type="button"
        title="窗宽 +20"
        onClick={() => {
          const next = adjustWindowLevel(normalized, 0, 20);
          setWindowLevel(next.center, next.width);
        }}
      >
        WW+
      </button>
      <button type="button" onClick={() => setZoom(zoom + 0.1)}>
        Zoom+
      </button>
      <button type="button" onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}>
        Zoom-
      </button>
      <button type="button" onClick={resetViewport}>
        Reset
      </button>
      <span>
        WC {normalized.center} / WW {normalized.width} · Zoom {zoom.toFixed(1)}
      </span>
      <span className="toolbar-hint">
        WC 调整亮度基准；WW 调整灰阶范围，越小对比越强。
      </span>
    </div>
  );
}
