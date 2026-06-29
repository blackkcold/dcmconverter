import { useRef, useState } from 'react';

import { SerialBatchExportRunner } from '@/export/batchExportRunner';
import {
  createExportArchiveFileName,
  EXPORT_NAMING_FIELDS
} from '@/export/exportNaming';
import {
  isDirectoryWriteSupported,
  requestExportDirectory
} from '@/export/fileSystemAccess';
import type { FileSystemDirectoryHandleLike } from '@/export/fileSystemAccess';
import {
  createLocalizedText,
  formatLocalizedText,
  useLocaleStore,
  useTranslator,
  type LocalizedText
} from '@/i18n';
import { useDicomStore } from '@/store/useDicomStore';
import { useExportStore } from '@/store/useExportStore';
import { useViewerStore } from '@/store/useViewerStore';

const SCOPES = [
  { value: 'current', key: 'export.scopeCurrent' },
  { value: 'series', key: 'export.scopeSeries' },
  { value: 'all', key: 'export.scopeAll' }
] as const;

const EXPORT_MODES = [
  { value: 'folder', key: 'export.outputModeFolder' },
  { value: 'zip', key: 'export.outputModeZip' }
] as const;

const FILE_NAME_TEMPLATE_MODES = [
  { value: 'preset', key: 'export.fileNameTemplateModePreset' },
  { value: 'fields', key: 'export.fileNameTemplateModeFields' }
] as const;

const FILE_NAME_TEMPLATE_PRESETS = [
  { value: 'standard', key: 'export.fileNamePresetStandard' },
  { value: 'study', key: 'export.fileNamePresetStudy' },
  { value: 'series', key: 'export.fileNamePresetSeries' }
] as const;

const OUTPUT_LAYOUTS = [
  { value: 'dicomSmart', key: 'export.layoutDicomSmart' },
  { value: 'metadataField', key: 'export.layoutMetadataField' },
  { value: 'series', key: 'export.layoutSeries' },
  { value: 'seriesSource', key: 'export.layoutSeriesSource' },
  { value: 'source', key: 'export.layoutSource' },
  { value: 'flat', key: 'export.layoutFlat' }
] as const;

const METADATA_FIELDS = [
  { value: 'seriesDescription', key: 'export.metadataFieldSeriesDescription' },
  { value: 'protocolName', key: 'export.metadataFieldProtocolName' },
  { value: 'instanceNumber', key: 'export.metadataFieldInstanceNumber' }
] as const;

export function ExportPanel() {
  const { files, studies, metadataByFileId, activeFileId } = useDicomStore();
  const locale = useLocaleStore((state) => state.locale);
  const t = useTranslator();
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
  const [message, setMessage] = useState<string | LocalizedText>('');

  async function handleChooseDirectory() {
    const result = await requestExportDirectory(locale);
    if (!result.ok) {
      setMessage(result.error.message);
      return;
    }

    directoryHandleRef.current = result.value;
    setTargetDirectoryName(result.value.name);
    setOptions({ exportMode: 'folder' });
    setMessage(createLocalizedText('export.targetDirectorySelected', { name: result.value.name }));
  }

  async function handleExport(mode: 'all' | 'failed' = 'all') {
    if (files.length === 0) {
      setMessage(createLocalizedText('export.noFiles'));
      return;
    }

    if (
      options.exportMode === 'folder' &&
      !directoryHandleRef.current &&
      isDirectoryWriteSupported()
    ) {
      setMessage(createLocalizedText('export.selectDirectoryFirst'));
      return;
    }

    const exportOptions =
      options.exportMode === 'folder' && !isDirectoryWriteSupported()
        ? { ...options, exportMode: 'zip' as const }
        : options;

    setRunning(true);
    setPaused(false);
    setMessage(createLocalizedText('export.starting'));

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
        locale,
        ...(windowLevel ? { currentWindowLevel: windowLevel } : {}),
        onJobsChange: setJobs,
        onMessage: setMessage
      });
      runnerRef.current = runner;
      const result = await runner.run();

      if (result.zipBlob) {
        triggerDownload(
          result.zipBlob,
          result.zipFileName ?? createExportArchiveFileName(options.exportPackageName)
        );
      }

      const successCount = result.jobs.filter((job) => job.status === 'success').length;
      const failedCount = result.jobs.filter((job) => job.status === 'failed').length;
      const skippedCount = result.jobs.filter((job) => job.status === 'skipped').length;
      setMessage(
        createLocalizedText('export.completed', {
          success: successCount,
          failed: failedCount,
          skipped: skippedCount
        })
      );
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'message' in error) {
        setMessage(String((error as { message?: unknown }).message ?? t('export.failed')));
      } else {
        setMessage(t('export.failed'));
      }
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

  function toggleFileNameField(
    field: (typeof EXPORT_NAMING_FIELDS)[number]['key'],
    checked: boolean
  ): void {
    const selected = new Set(options.fileNameTemplateFields);

    if (checked) {
      selected.add(field);
    } else {
      selected.delete(field);
    }

    const next = EXPORT_NAMING_FIELDS.map((item) => item.key).filter((item) =>
      selected.has(item)
    );
    if (next.length === 0) {
      return;
    }

    setOptions({ fileNameTemplateFields: next });
  }

  const directorySupported = isDirectoryWriteSupported();
  const failedCount = jobs.filter((job) => job.status === 'failed').length;

  return (
    <section className="tool-section">
      <h2>{t('export.heading')}</h2>
      <label>
        {t('export.scope')}
        <select
          value={options.scope}
          onChange={(event) =>
            setOptions({ scope: event.target.value as typeof options.scope })
          }
        >
          {SCOPES.map((item) => (
            <option key={item.value} value={item.value}>
              {t(item.key)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t('export.outputMode')}
        <select
          value={options.exportMode}
          onChange={(event) =>
            setOptions({ exportMode: event.target.value as typeof options.exportMode })
          }
        >
          {EXPORT_MODES.map((item) => (
            <option key={item.value} value={item.value} disabled={item.value === 'folder' && !directorySupported}>
              {t(item.key)}
            </option>
          ))}
        </select>
      </label>
      {options.exportMode === 'folder' ? (
        <div className="button-row">
          <button
            type="button"
            disabled={!directorySupported}
            onClick={handleChooseDirectory}
          >
            {t('export.chooseDirectory')}
          </button>
          <span className="muted">
            {targetDirectoryName
              ? t('export.targetDirectorySelected', { name: targetDirectoryName })
              : t('export.targetDirectoryUnset')}
          </span>
        </div>
      ) : null}
      <label>
        {t('export.packageName')}
        <input
          type="text"
          value={options.exportPackageName}
          placeholder="dicom-jpeg-export"
          onChange={(event) =>
            setOptions({ exportPackageName: event.target.value })
          }
        />
      </label>
      <p className="muted">{t('export.packageNameHint')}</p>
      <div className="template-section">
        <label>
          {t('export.fileNameTemplateMode')}
          <select
            value={options.fileNameTemplateMode}
            onChange={(event) =>
              setOptions({
                fileNameTemplateMode: event.target.value as typeof options.fileNameTemplateMode
              })
            }
          >
            {FILE_NAME_TEMPLATE_MODES.map((item) => (
              <option key={item.value} value={item.value}>
                {t(item.key)}
              </option>
            ))}
          </select>
        </label>
        {options.fileNameTemplateMode === 'preset' ? (
          <label>
            {t('export.fileNamePreset')}
            <select
              value={options.fileNameTemplatePreset}
              onChange={(event) =>
                setOptions({
                  fileNameTemplatePreset: event.target.value as typeof options.fileNameTemplatePreset
                })
              }
            >
              {FILE_NAME_TEMPLATE_PRESETS.map((item) => (
                <option key={item.value} value={item.value}>
                  {t(item.key)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="template-field-grid" role="group" aria-label={t('export.fileNameFields')}>
            {EXPORT_NAMING_FIELDS.map((field) => (
              <label key={field.key} className="checkbox-row template-field-option">
                <input
                  type="checkbox"
                  checked={options.fileNameTemplateFields.includes(field.key)}
                  onChange={(event) =>
                    toggleFileNameField(field.key, event.target.checked)
                  }
                />
                {t(field.labelKey)}
              </label>
            ))}
          </div>
        )}
      </div>
      <p className="muted">{t('export.fileNameTemplateHint')}</p>
      <label>
        {t('export.layout')}
        <select
          value={options.outputLayout}
          onChange={(event) =>
            setOptions({
              outputLayout: event.target.value as typeof options.outputLayout
            })
          }
        >
          {OUTPUT_LAYOUTS.map((item) => (
            <option key={item.value} value={item.value}>
              {t(item.key)}
            </option>
          ))}
        </select>
      </label>
      {options.outputLayout === 'metadataField' ? (
        <label>
          {t('export.metadataField')}
          <select
            value={options.metadataFolderField}
            onChange={(event) =>
              setOptions({
                metadataFolderField: event.target
                  .value as typeof options.metadataFolderField
              })
            }
          >
            {METADATA_FIELDS.map((item) => (
              <option key={item.value} value={item.value}>
                {t(item.key)}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label>
        {t('export.jpegQuality', { quality: Math.round(options.jpegQuality * 100) })}
        <input
          type="range"
          min="0.85"
          max="1"
          step="0.01"
          value={options.jpegQuality}
          onChange={(event) => setOptions({ jpegQuality: Number(event.target.value) })}
        />
      </label>
      <div className="button-row">
        <button type="button" onClick={() => setOptions({ jpegQuality: 0.92 })}>
          {t('export.qualityStandard')}
        </button>
        <button type="button" onClick={() => setOptions({ jpegQuality: 1 })}>
          {t('export.qualityUltra')}
        </button>
      </div>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={options.includeOverlay}
          onChange={(event) => setOptions({ includeOverlay: event.target.checked })}
        />
        {t('export.burnInKeyInfo')}
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
        {t('export.includePersonalInfo')}
      </label>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={options.anonymizeOverlay && !options.includePersonalInfo}
          disabled={options.includePersonalInfo}
          onChange={(event) => setOptions({ anonymizeOverlay: event.target.checked })}
        />
        {t('export.anonymizeOverlay')}
      </label>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={options.patientOverrideEnabled}
          onChange={(event) =>
            setOptions({ patientOverrideEnabled: event.target.checked })
          }
        />
        {t('export.overridePatient')}
      </label>
      {options.patientOverrideEnabled ? (
        <div className="patient-override-grid">
          <label>
            {t('export.patientName')}
            <input
              type="text"
              value={options.patientOverride.patientName ?? ''}
              onChange={(event) =>
                setOptions({
                  patientOverride: {
                    ...options.patientOverride,
                    patientName: event.target.value
                  }
                })
              }
            />
          </label>
          <label>
            {t('export.patientSex')}
            <input
              type="text"
              value={options.patientOverride.patientSex ?? ''}
              placeholder="M / F / O"
              onChange={(event) =>
                setOptions({
                  patientOverride: {
                    ...options.patientOverride,
                    patientSex: event.target.value
                  }
                })
              }
            />
          </label>
          <label>
            {t('export.patientAge')}
            <input
              type="text"
              value={options.patientOverride.patientAge ?? ''}
              placeholder={t('export.patientAgePlaceholder')}
              onChange={(event) =>
                setOptions({
                  patientOverride: {
                    ...options.patientOverride,
                    patientAge: event.target.value
                  }
                })
              }
            />
          </label>
        </div>
      ) : null}
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={options.includeJpegDescription}
          onChange={(event) =>
            setOptions({ includeJpegDescription: event.target.checked })
          }
        />
        {t('export.writeJpegDescription')}
      </label>
      <p className="muted">{t('export.writeJpegDescriptionHint')}</p>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={options.includeJpegExtendedMetadata}
          onChange={(event) =>
            setOptions({ includeJpegExtendedMetadata: event.target.checked })
          }
        />
        {t('export.writeJpegExtendedMeta')}
      </label>
      <p className="muted">{t('export.writeJpegExtendedMetaHint')}</p>
      <label>
        {t('export.batchSize', { count: options.batchSize })}
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
        {t('export.resumeMode')}
      </label>
      <div className="button-row">
        <button
          type="button"
          disabled={running}
          onClick={() => void handleExport('all')}
        >
          {running ? t('export.exporting') : t('export.startBatchExport')}
        </button>
        <button
          type="button"
          disabled={running || failedCount === 0}
          onClick={() => void handleExport('failed')}
        >
          {t('export.retryFailed')}
        </button>
      </div>
      {running ? (
        <div className="button-row">
          <button type="button" disabled={paused} onClick={handlePause}>
            {t('export.pause')}
          </button>
          <button type="button" disabled={!paused} onClick={handleResume}>
            {t('export.resume')}
          </button>
          <button type="button" onClick={handleCancel}>
            {t('export.cancel')}
          </button>
        </div>
      ) : null}
      {message ? <p className="inline-status">{formatLocalizedText(locale, message)}</p> : null}
      <p className="privacy-warning">
        {t('export.pixelPhiWarning')}
      </p>
      {options.includePersonalInfo ? (
        <p className="privacy-warning">
          {t('export.privacyWarning')}
        </p>
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
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
