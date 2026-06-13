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

function readAllEntries(
  reader: FileSystemDirectoryReader
): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const result: FileSystemEntry[] = [];
    const read = () => {
      reader.readEntries((batch) => {
        if (batch.length === 0) {
          resolve(result);
          return;
        }
        result.push(...batch);
        read();
      }, reject);
    };
    read();
  });
}

function fileEntryToFile(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => entry.file(resolve, reject));
}

async function readDirectoryRecursive(
  dirEntry: FileSystemDirectoryEntry
): Promise<File[]> {
  const entries = await readAllEntries(dirEntry.createReader());
  const files: File[] = [];

  for (const entry of entries) {
    if (entry.isFile) {
      const file = await fileEntryToFile(entry as FileSystemFileEntry);
      Object.defineProperty(file, 'webkitRelativePath', {
        value: entry.fullPath.slice(1),
        configurable: true
      });
      files.push(file);
    } else if (entry.isDirectory) {
      files.push(
        ...(await readDirectoryRecursive(entry as FileSystemDirectoryEntry))
      );
    }
  }
  return files;
}

async function getFilesFromDataTransfer(dt: DataTransfer): Promise<File[]> {
  const files: File[] = [];
  for (let i = 0; i < dt.items.length; i++) {
    const item = dt.items[i];
    if (!item || item.kind !== 'file') continue;

    const entry = item.webkitGetAsEntry?.();
    if (!entry) {
      const file = item.getAsFile();
      if (file) files.push(file);
      continue;
    }

    if (entry.isFile) {
      files.push(await fileEntryToFile(entry as FileSystemFileEntry));
    } else if (entry.isDirectory) {
      files.push(
        ...(await readDirectoryRecursive(entry as FileSystemDirectoryEntry))
      );
    }
  }
  return files;
}

export function FileImportPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const directoryInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const locale = useLocaleStore((state) => state.locale);
  const { addFiles, setMetadata } = useDicomStore();
  const t = useTranslator();

  const processFiles = useCallback(
    async (fileList: readonly File[] | FileList | null) => {
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

  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (busy) return;

    const dt = e.dataTransfer;
    if (!dt) return;

    const files = await getFilesFromDataTransfer(dt);
    if (files.length === 0) return;
    await processFiles(files);
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
