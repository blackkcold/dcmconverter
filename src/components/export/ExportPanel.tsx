import { useRef, useState } from 'react';

import { SerialBatchExportRunner } from '@/export/batchExportRunner';
import {
  isDirectoryWriteSupported,
  requestExportDirectory
} from '@/export/fileSystemAccess';
import type { FileSystemDirectoryHandleLike } from '@/export/fileSystemAccess';
import { useDicomStore } from '@/store/useDicomStore';
import { useExportStore } from '@/store/useExportStore';
import { useViewerStore } from '@/store/useViewerStore';

export function ExportPanel() {
  const { files, studies, metadataByFileId, activeFileId } = useDicomStore();
  const {
    jobs,
    options,
    targetDirectoryName,
    setOptions,
    setJobs,
    setRunning,
    setPaused,
    setTargetDirectoryName,
    running,
    paused
  } = useExportStore();
  const { windowCenter, windowWidth } = useViewerStore();
  const directoryHandleRef = useRef<FileSystemDirectoryHandleLike | undefined>(
    undefined
  );
  const runnerRef = useRef<SerialBatchExportRunner | undefined>(undefined);
  const [message, setMessage] = useState('');

  async function handleChooseDirectory() {
    const result = await requestExportDirectory();
    if (!result.ok) {
      setMessage(result.error.message);
      return;
    }

    directoryHandleRef.current = result.value;
    setTargetDirectoryName(result.value.name);
    setOptions({ exportMode: 'folder' });
    setMessage(`目标文件夹：${result.value.name}`);
  }

  async function handleExport(mode: 'all' | 'failed' = 'all') {
    if (files.length === 0) {
      setMessage('请先导入 DICOM 文件。');
      return;
    }

    if (
      options.exportMode === 'folder' &&
      !directoryHandleRef.current &&
      isDirectoryWriteSupported()
    ) {
      setMessage('请先选择导出目标文件夹。');
      return;
    }

    const exportOptions =
      options.exportMode === 'folder' && !isDirectoryWriteSupported()
        ? { ...options, exportMode: 'zip' as const }
        : options;

    setRunning(true);
    setPaused(false);
    setMessage('开始串行批量导出...');

    try {
      const windowLevel =
        windowCenter !== undefined && windowWidth !== undefined
          ? { center: windowCenter, width: windowWidth }
          : undefined;
      const runner = new SerialBatchExportRunner({
        files,
        studies,
        metadataByFileId,
        options: exportOptions,
        previousJobs: jobs,
        mode,
        ...(activeFileId ? { activeFileId } : {}),
        ...(directoryHandleRef.current
          ? { directoryHandle: directoryHandleRef.current }
          : {}),
        ...(windowLevel ? { currentWindowLevel: windowLevel } : {}),
        onJobsChange: setJobs,
        onMessage: setMessage
      });
      runnerRef.current = runner;
      const result = await runner.run();

      if (result.zipBlob) {
        triggerDownload(result.zipBlob, 'dicom-jpeg-export.zip');
      }

      const successCount = result.jobs.filter((job) => job.status === 'success').length;
      const failedCount = result.jobs.filter((job) => job.status === 'failed').length;
      const skippedCount = result.jobs.filter((job) => job.status === 'skipped').length;
      setMessage(
        `导出完成：成功 ${successCount}，失败 ${failedCount}，跳过 ${skippedCount}。`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '批量导出失败。');
    } finally {
      setRunning(false);
      setPaused(false);
      runnerRef.current = undefined;
    }
  }

  function handlePause() {
    runnerRef.current?.pause();
    setPaused(true);
  }

  function handleResume() {
    runnerRef.current?.resume();
    setPaused(false);
  }

  function handleCancel() {
    runnerRef.current?.cancel();
  }

  const directorySupported = isDirectoryWriteSupported();
  const failedCount = jobs.filter((job) => job.status === 'failed').length;

  return (
    <section className="tool-section">
      <h2>Export</h2>
      <label>
        范围
        <select
          value={options.scope}
          onChange={(event) =>
            setOptions({ scope: event.target.value as typeof options.scope })
          }
        >
          <option value="current">当前图像</option>
          <option value="series">当前序列</option>
          <option value="all">全部导入文件</option>
        </select>
      </label>
      <label>
        输出方式
        <select
          value={options.exportMode}
          onChange={(event) =>
            setOptions({ exportMode: event.target.value as typeof options.exportMode })
          }
        >
          <option value="folder" disabled={!directorySupported}>
            目标文件夹（断点继续）
          </option>
          <option value="zip">ZIP 下载</option>
        </select>
      </label>
      {options.exportMode === 'folder' ? (
        <div className="button-row">
          <button type="button" disabled={!directorySupported} onClick={handleChooseDirectory}>
            选择导出文件夹
          </button>
          <span className="muted">
            {targetDirectoryName ?? '尚未选择目标文件夹'}
          </span>
        </div>
      ) : null}
      <label>
        JPEG 质量 {options.jpegQuality.toFixed(2)}
        <input
          type="range"
          min="0.85"
          max="0.95"
          step="0.01"
          value={options.jpegQuality}
          onChange={(event) => setOptions({ jpegQuality: Number(event.target.value) })}
        />
      </label>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={options.includeOverlay}
          onChange={(event) => setOptions({ includeOverlay: event.target.checked })}
        />
        烧录关键信息
      </label>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={options.includePersonalInfo}
          onChange={(event) =>
            setOptions({
              includePersonalInfo: event.target.checked,
              anonymizeOverlay: event.target.checked ? false : options.anonymizeOverlay
            })
          }
        />
        包含个人信息
      </label>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={options.anonymizeOverlay && !options.includePersonalInfo}
          disabled={options.includePersonalInfo}
          onChange={(event) => setOptions({ anonymizeOverlay: event.target.checked })}
        />
        匿名 overlay
      </label>
      <label>
        每批数量 {options.batchSize}
        <input
          type="number"
          min="1"
          max="200"
          value={options.batchSize}
          onChange={(event) =>
            setOptions({
              batchSize: Number.isFinite(Number(event.target.value))
                ? Math.max(1, Number(event.target.value))
                : 25
            })
          }
        />
      </label>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={options.resumeMode}
          onChange={(event) => setOptions({ resumeMode: event.target.checked })}
        />
        断点继续
      </label>
      <div className="button-row">
        <button type="button" disabled={running} onClick={() => void handleExport('all')}>
          {running ? '导出中...' : '开始批量导出'}
        </button>
        <button
          type="button"
          disabled={running || failedCount === 0}
          onClick={() => void handleExport('failed')}
        >
          只重试失败项
        </button>
      </div>
      {running ? (
        <div className="button-row">
          <button type="button" disabled={paused} onClick={handlePause}>
            暂停
          </button>
          <button type="button" disabled={!paused} onClick={handleResume}>
            继续
          </button>
          <button type="button" onClick={handleCancel}>
            取消
          </button>
        </div>
      ) : null}
      {message ? <p className="inline-status">{message}</p> : null}
      {options.includePersonalInfo ? (
        <p className="privacy-warning">当前会把 PatientName / PatientID 烧录到 JPEG。</p>
      ) : null}
    </section>
  );
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
