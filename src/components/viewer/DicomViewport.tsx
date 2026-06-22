import { type CSSProperties, useEffect, useRef, useState } from 'react';

import {
  type ActiveViewportController,
  renderDicomFileToElement
} from '@/viewer/viewportController';
import { DEFAULT_WINDOW_LEVEL, normalizeWindowLevel } from '@/viewer/windowLevel';
import {
  useActiveDicomFile,
  useActiveDicomMetadata,
  useDicomStore
} from '@/store/useDicomStore';
import {
  createLocalizedText,
  formatLocalizedText,
  useLocaleStore,
  useTranslator,
  type LocalizedText
} from '@/i18n';
import { useViewerStore } from '@/store/useViewerStore';
import { getNextSeriesFileId } from '@/viewer/stackNavigation';

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
  const normalizedRef = useRef(DEFAULT_WINDOW_LEVEL);
  const activeFile = useActiveDicomFile();
  const metadata = useActiveDicomMetadata();
  const { activeFileId, studies, setActiveFileId } = useDicomStore();
  const { windowCenter, windowWidth, zoom } = useViewerStore();
  const locale = useLocaleStore((state) => state.locale);
  const t = useTranslator();
  const PROGRESS_STEPS: Record<string, number> = {
    'viewer.waitingImport': 0,
    'viewer.initializing': 10,
    'viewer.registeringFile': 30,
    'viewer.creatingViewport': 50,
    'viewer.decodingImage': 70,
    'viewer.renderingImage': 90,
    'viewer.loadedFile': 100
  };
  const [status, setStatus] = useState<LocalizedText | string>(
    createLocalizedText('viewer.waitingImport')
  );
  const [currentStep, setCurrentStep] = useState('viewer.waitingImport');
  const [stageSize, setStageSize] = useState<ViewportSize>({
    width: 0,
    height: 0
  });
  const normalized = normalizeWindowLevel(
    windowCenter ?? metadata?.windowCenter,
    windowWidth ?? metadata?.windowWidth
  );
  const normalizedCenter = normalized.center;
  const normalizedWidth = normalized.width;
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
    normalizedRef.current = {
      center: normalizedCenter,
      width: normalizedWidth
    };
    controllerRef.current?.setWindowLevel(normalizedCenter, normalizedWidth);
  }, [normalizedCenter, normalizedWidth]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        document.body.hasAttribute('data-panel-open') ||
        !isStackNavigationKey(event.key) ||
        shouldIgnoreKeyboardTarget(event.target)
      ) {
        return;
      }

      const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
      const nextFileId = getNextSeriesFileId(studies, activeFileId, direction);

      if (!nextFileId || nextFileId === activeFileId) {
        return;
      }

      event.preventDefault();
      setActiveFileId(nextFileId);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFileId, setActiveFileId, studies]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    if (!activeFile) {
      controllerRef.current = undefined;
      queueMicrotask(() =>
        setStatus(createLocalizedText('viewer.waitingImport'))
      );
      return;
    }

    let disposed = false;
    let cleanup: (() => void) | undefined;
    controllerRef.current = undefined;
    queueMicrotask(() =>
      setStatus(createLocalizedText('viewer.initializing'))
    );

    renderDicomFileToElement(activeFile.file, host, locale, (step) => {
      queueMicrotask(() => {
        setCurrentStep(step);
        setStatus(createLocalizedText(step as Parameters<typeof createLocalizedText>[0]));
      });
    }).then((result) => {
      if (disposed) {
        if (result.ok) {
          result.value.dispose();
        }
        return;
      }

      if (result.ok) {
        controllerRef.current = result.value;
        cleanup = result.value.dispose;
        setStatus(createLocalizedText('viewer.loadedFile', { name: activeFile.name }));
        const currentWindowLevel = normalizedRef.current;
        result.value.setWindowLevel(
          currentWindowLevel.center,
          currentWindowLevel.width
        );
        result.value.resize();
        return;
      }

      const errorMessage = result.error.message;
      const isNetworkError = /network|offline|fetch|load.*engine|cornerstone.*init/i.test(errorMessage);
      const isTimeout = /timed out/i.test(errorMessage);
      setStatus(
        isNetworkError
          ? createLocalizedText('error.offlineEngineRequired')
          : isTimeout
            ? `${errorMessage}\n请检查 DevTools Console 获取详细错误。`
            : errorMessage
      );
    });

    return () => {
      disposed = true;
      controllerRef.current = undefined;
      cleanup?.();
    };
  }, [activeFile, locale]);

  return (
    <div ref={stageRef} className="viewport-stage">
      <div className="viewport-wrap" style={viewportStyle}>
        <div
          ref={hostRef}
          className="dicom-viewport"
          data-testid="dicom-viewport"
          style={{ transform: `scale(${zoom})` }}
        >
          {!activeFile ? <p className="viewport-placeholder">{t('viewer.noSelection')}</p> : null}
        </div>
        <div className="viewport-overlay" aria-live="polite">
          <span>{formatLocalizedText(locale, status)}</span>
          <div className="viewport-progress-track">
            <div
              className="viewport-progress-fill"
              style={{ width: `${PROGRESS_STEPS[currentStep] ?? 0}%` }}
            />
          </div>
          <span>
            WC {normalized.center} / WW {normalized.width}
          </span>
        </div>
      </div>
    </div>
  );
}

function isStackNavigationKey(key: string): key is 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' {
  return (
    key === 'ArrowRight' ||
    key === 'ArrowDown' ||
    key === 'ArrowLeft' ||
    key === 'ArrowUp'
  );
}

function shouldIgnoreKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  return ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName);
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
