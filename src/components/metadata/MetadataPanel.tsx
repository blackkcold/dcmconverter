import { useActiveDicomMetadata } from '@/store/useDicomStore';

const METADATA_ROWS = [
  ['Patient', 'patientName'],
  ['Patient ID', 'patientId'],
  ['Modality', 'modality'],
  ['Study Date', 'studyDate'],
  ['Study', 'studyDescription'],
  ['Protocol', 'protocolName'],
  ['Series', 'seriesDescription'],
  ['Series No.', 'seriesNumber'],
  ['Instance No.', 'instanceNumber'],
  ['Slice Thickness', 'sliceThickness'],
  ['Pixel Spacing', 'pixelSpacing'],
  ['Rescale Type', 'rescaleType'],
  ['Manufacturer', 'manufacturer'],
  ['Model', 'manufacturerModelName'],
  ['Rows', 'rows'],
  ['Columns', 'columns'],
  ['Transfer Syntax', 'transferSyntaxUID']
] as const;

export function MetadataPanel() {
  const metadata = useActiveDicomMetadata();

  return (
    <section className="tool-section">
      <h2>Metadata</h2>
      {!metadata ? (
        <p className="empty-state">暂无 metadata。导入标准 DICOM P10 后自动解析。</p>
      ) : (
        <dl className="metadata-list">
          {METADATA_ROWS.map(([label, key]) => (
            <div key={key}>
              <dt>{label}</dt>
              <dd>{String(metadata[key] ?? 'unknown')}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
