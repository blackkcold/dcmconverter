import type { ChangeEvent, DragEvent, InputHTMLAttributes } from 'react';
import { useCallback, useRef, useState } from 'react';

import { ingestFiles } from '@/dicom/fileIngest';
import { parseDicomMetadata } from '@/dicom/metadataParser';
import { useLocaleStore, useTranslator } from '@/i18n';
import { useDicomStore } from '@/store/useDicomStore';

type DirectoryInputProps = InputHTMLAttributes<HTMLInputElement> & {
  webkitdirectory?: string;
  directory?: string;
};

export function FileImportPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const directoryInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const locale = useLocaleStore((state) => state.locale);
  const { addFiles, setMetadata } = useDicomStore();
  const t = useTranslator();

  const processFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      setBusy(true);
      try {
        const result = ingestFiles(fileList, locale);
        addFiles(result.files, result.skippedFiles);

        await Promise.all(
          result.files.map(async (localFile) => {
            const metadataResult = await parseDicomMetadata(localFile.file, locale);
            if (metadataResult.ok) {
              setMetadata(localFile.id, metadataResult.value);
            }
          })
        );
      } finally {
        setBusy(false);
      }
    },
    [locale, addFiles, setMetadata]
  );

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    await processFiles(event.target.files);
    event.target.value = '';
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    setIsDragOver(true);
  }

  function handleDragLeave(e: DragEvent) {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (busy) return;
    void processFiles(e.dataTransfer?.files ?? null);
  }

  const directoryProps: DirectoryInputProps = {
    type: 'file',
    multiple: true,
    webkitdirectory: '',
    directory: '',
    onChange: handleChange
  };

  const dragHint = isDragOver ? t('import.dragDropActive') : t('import.dragDropHint');

  return (
    <section
      className={`tool-section${isDragOver ? ' drag-over' : ''}`}
      onDragEnter={handleDragOver}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h2>{t('import.heading')}</h2>
      <div className="button-row">
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          {t('import.selectFile')}
        </button>
        <button type="button" onClick={() => directoryInputRef.current?.click()}>
          {t('import.selectDirectory')}
        </button>
      </div>
      <p className="muted">{t('import.browserOnly')}</p>
      <p className="muted">{dragHint}</p>
      {busy ? <p className="inline-status">{t('import.parsingMetadata')}</p> : null}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".dcm,.dicom,.ima,application/dicom"
        hidden
        onChange={handleChange}
      />
      <input ref={directoryInputRef} hidden {...directoryProps} />
    </section>
  );
}
