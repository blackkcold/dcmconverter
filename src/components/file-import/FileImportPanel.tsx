import type { ChangeEvent, InputHTMLAttributes } from 'react';
import { useRef, useState } from 'react';

import { ingestFiles } from '@/dicom/fileIngest';
import { parseDicomMetadata } from '@/dicom/metadataParser';
import { useDicomStore } from '@/store/useDicomStore';

type DirectoryInputProps = InputHTMLAttributes<HTMLInputElement> & {
  webkitdirectory?: string;
  directory?: string;
};

export function FileImportPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const directoryInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { addFiles, setMetadata } = useDicomStore();

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = event.target.files;
    if (!selectedFiles) {
      return;
    }

    setBusy(true);
    const result = ingestFiles(selectedFiles);
    addFiles(result.files, result.skippedFiles);

    await Promise.all(
      result.files.map(async (localFile) => {
        const metadataResult = await parseDicomMetadata(localFile.file);
        if (metadataResult.ok) {
          setMetadata(localFile.id, metadataResult.value);
        }
      })
    );

    event.target.value = '';
    setBusy(false);
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
      <h2>导入</h2>
      <div className="button-row">
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          选择 DICOM 文件
        </button>
        <button type="button" onClick={() => directoryInputRef.current?.click()}>
          选择目录
        </button>
      </div>
      <p className="muted">
        浏览器仅能读取你主动选择的文件或目录；不会扫描磁盘路径。
      </p>
      {busy ? <p className="inline-status">正在解析 metadata...</p> : null}
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
