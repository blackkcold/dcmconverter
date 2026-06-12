import { type CSSProperties, useEffect, useRef, useState } from 'react';

import {
  type ActiveViewportController,
  renderDicomFileToElement
} from '@/viewer/viewportController';
import { normalizeWindowLevel } from '@/viewer/windowLevel';
import { useActiveDicomFile, useActiveDicomMetadata } from '@/store/useDicomStore';
import { useViewerStore } from '@/store/useViewerStore';

interface ViewportSize {
  width: number;
  height: number;
}

interface ImageSize {
  columns: number;
  rows: number;
}

export function DicomViewport() {
  const stageRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<ActiveViewportController | undefined>(undefined);
  const activeFile = useActiveDicomFile();
  const metadata = useActiveDicomMetadata();
  const { windowCenter, windowWidth, zoom } = useViewerStore();
  const [status, setStatus] = useState('等待导入 DICOM');
  const [stageSize, setStageSize] = useState<ViewportSize>({
    width: 0,
    height: 0
  });
  const normalized = normalizeWindowLevel(
    windowCenter ?? metadata?.windowCenter,
    windowWidth ?? metadata?.windowWidth
  );
  const imageSize = getImageSize(metadata);
  const frameSize = imageSize
    ? getFittedFrameSize(imageSize, stageSize)
    : undefined;
  const viewportStyle: CSSProperties | undefined =
    imageSize && frameSize
      ? {
          width: `${frameSize.width}px`,
          height: `${frameSize.height}px`,
          aspectRatio: `${imageSize.columns} / ${imageSize.rows}`
        }
      : undefined;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const updateStageSize = () => {
      const { width, height } = stage.getBoundingClientRect();
      setStageSize((current) => {
        if (current.width === width && current.height === height) {
          return current;
        }

        return { width, height };
      });
    };

    updateStageSize();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(updateStageSize);
    observer.observe(stage);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    controllerRef.current?.resize();
  }, [frameSize?.width, frameSize?.height]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !activeFile) {
      return;
    }

    let disposed = false;
    let cleanup: (() => void) | undefined;
    controllerRef.current = undefined;
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
        controllerRef.current = result.value;
        cleanup = result.value.dispose;
        setStatus(`已加载 ${activeFile.name}`);
        result.value.resize();
        return;
      }

      setStatus(result.error.message);
    });

    return () => {
      disposed = true;
      controllerRef.current = undefined;
      cleanup?.();
    };
  }, [activeFile]);

  return (
    <div ref={stageRef} className="viewport-stage">
      <div className="viewport-wrap" style={viewportStyle}>
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
    </div>
  );
}

function getImageSize(
  metadata: ReturnType<typeof useActiveDicomMetadata>
): ImageSize | undefined {
  const columns = Number(metadata?.columns);
  const rows = Number(metadata?.rows);

  if (!Number.isFinite(columns) || !Number.isFinite(rows)) {
    return undefined;
  }

  if (columns <= 0 || rows <= 0) {
    return undefined;
  }

  return { columns, rows };
}

function getFittedFrameSize(
  imageSize: ImageSize,
  stageSize: ViewportSize
): ViewportSize | undefined {
  if (stageSize.width <= 0 || stageSize.height <= 0) {
    return undefined;
  }

  const imageRatio = imageSize.columns / imageSize.rows;
  const stageRatio = stageSize.width / stageSize.height;

  if (stageRatio > imageRatio) {
    const height = stageSize.height;
    return {
      width: Math.max(1, Math.floor(height * imageRatio)),
      height: Math.max(1, Math.floor(height))
    };
  }

  const width = stageSize.width;
  return {
    width: Math.max(1, Math.floor(width)),
    height: Math.max(1, Math.floor(width / imageRatio))
  };
}
