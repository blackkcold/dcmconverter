import { useEffect, useRef, useState } from 'react';

import { renderDicomFileToElement } from '@/viewer/viewportController';
import { normalizeWindowLevel } from '@/viewer/windowLevel';
import { useActiveDicomFile, useActiveDicomMetadata } from '@/store/useDicomStore';
import { useViewerStore } from '@/store/useViewerStore';

export function DicomViewport() {
  const hostRef = useRef<HTMLDivElement>(null);
  const activeFile = useActiveDicomFile();
  const metadata = useActiveDicomMetadata();
  const { windowCenter, windowWidth, zoom } = useViewerStore();
  const [status, setStatus] = useState('等待导入 DICOM');
  const normalized = normalizeWindowLevel(
    windowCenter ?? metadata?.windowCenter,
    windowWidth ?? metadata?.windowWidth
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !activeFile) {
      return;
    }

    let disposed = false;
    let cleanup: (() => void) | undefined;
    host.replaceChildren();
    setStatus('正在初始化 Cornerstone viewport...');

    renderDicomFileToElement(activeFile.file, host).then((result) => {
      if (disposed) {
        if (result.ok) {
          result.value.dispose();
        }
        return;
      }

      if (result.ok) {
        cleanup = result.value.dispose;
        setStatus(`已加载 ${activeFile.name}`);
        return;
      }

      setStatus(result.error.message);
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [activeFile]);

  return (
    <div className="viewport-wrap">
      <div
        ref={hostRef}
        className="dicom-viewport"
        data-testid="dicom-viewport"
        style={{ transform: `scale(${zoom})` }}
      >
        {!activeFile ? <p className="viewport-placeholder">未选择 DICOM</p> : null}
      </div>
      <div className="viewport-overlay" aria-live="polite">
        <span>{status}</span>
        <span>
          WC {normalized.center} / WW {normalized.width}
        </span>
      </div>
    </div>
  );
}
