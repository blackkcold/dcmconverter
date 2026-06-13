import type { ChangeEvent, InputHTMLAttributes } from 'react';
import { useRef, useState } from 'react';

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
  const locale = useLocaleStore((state) => state.locale);
  const { addFiles, setMetadata } = useDicomStore();
  const t = useTranslator();

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = event.target.files;
    if (!selectedFiles) {
      return;
    }

    setBusy(true);
    try {
      const result = ingestFiles(selectedFiles, locale);
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
      event.target.value = '';
      setBusy(false);
    }
  }

  const directoryProps: DirectoryInputProps = {
    type: 'file',
    multiple: true,
    webkitdirectory: '',
    directory: '',
    onChange: handleChange
  };

  return (
    <section className="tool-section">
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
