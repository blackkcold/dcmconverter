import type { ChangeEvent, DragEvent, InputHTMLAttributes } from 'react';
import { useCallback, useRef, useState } from 'react';

import type { DicomMetadata, SkippedFile } from '@/dicom/dicomTypes';
import { ingestFiles } from '@/dicom/fileIngest';
import { parseDicomMetadata } from '@/dicom/metadataParser';
import {
  getUnsupportedTransferSyntaxMessage,
  isSupportedTransferSyntax
} from '@/dicom/transferSyntax';
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
    try {
      if (entry.isFile) {
        const file = await fileEntryToFile(entry as FileSystemFileEntry);
        Object.defineProperty(file, 'webkitRelativePath', {
          value: entry.fullPath.slice(1),
          configurable: true
        });
        files.push(file);
      } else if (entry.isDirectory) {
        const subFiles = await readDirectoryRecursive(entry as FileSystemDirectoryEntry);
        files.push(...subFiles);
      }
    } catch (cause) {
      console.warn(
        `Skipping "${entry.name}" in "${dirEntry.name}": could not read`,
        cause
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
      if (file) {
        Object.defineProperty(file, 'webkitRelativePath', {
          value: file.name,
          configurable: true
        });
        files.push(file);
      }
      continue;
    }

    if (entry.isFile) {
      try {
        const file = await fileEntryToFile(entry as FileSystemFileEntry);
        Object.defineProperty(file, 'webkitRelativePath', {
          value: entry.fullPath.slice(1) || entry.name,
          configurable: true
        });
        files.push(file);
      } catch (cause) {
        console.warn(`Skipping file "${entry.name}": could not read`, cause);
      }
    } else if (entry.isDirectory) {
      try {
        const subFiles = await readDirectoryRecursive(entry as FileSystemDirectoryEntry);
        files.push(...subFiles);
      } catch (cause) {
        console.warn(
          `Skipping directory "${entry.name}": could not traverse`,
          cause
        );
      }
    }
  }

  // Fallback: use dt.files when items traversal yielded nothing (Firefox etc.)
  if (files.length === 0 && dt.files.length > 0) {
    for (let i = 0; i < dt.files.length; i++) {
      const file = dt.files[i];
      if (!file) continue;
      const record = file as File & { webkitRelativePath?: string };
      Object.defineProperty(file, 'webkitRelativePath', {
        value: record.webkitRelativePath ?? file.name,
        configurable: true
      });
      files.push(file);
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
  const { addFiles, batchSetMetadata } = useDicomStore();
  const t = useTranslator();

  const processFiles = useCallback(
    async (fileList: readonly File[] | FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      setBusy(true);
      try {
        const result = ingestFiles(fileList, locale);

        const metadataResults = await Promise.all(
          result.files.map(async (localFile) => {
            const metadataResult = await parseDicomMetadata(localFile.file, locale);
            return { localFile, metadataResult };
          })
        );

        const acceptedFiles = [];
        const allSkippedFiles: SkippedFile[] = [...result.skippedFiles];
        const metadataEntries: (readonly [string, DicomMetadata])[] = [];

        for (const { localFile, metadataResult } of metadataResults) {
          if (!metadataResult.ok) {
            allSkippedFiles.push({
              name: localFile.name,
              reason: metadataResult.error.message
            });
            continue;
          }

          const metadata = metadataResult.value;
          if (!isSupportedTransferSyntax(metadata.transferSyntaxUID)) {
            allSkippedFiles.push({
              name: localFile.name,
              reason: getUnsupportedTransferSyntaxMessage(locale)
            });
            continue;
          }

          acceptedFiles.push(localFile);
          metadataEntries.push([localFile.id, metadata]);
        }

        if (acceptedFiles.length > 0 || allSkippedFiles.length > 0) {
          addFiles(acceptedFiles, allSkippedFiles);
        }

        if (metadataEntries.length > 0) {
          batchSetMetadata(metadataEntries);
        }
      } finally {
        setBusy(false);
      }
    },
    [locale, addFiles, batchSetMetadata]
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
