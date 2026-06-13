import { useActiveDicomMetadata } from '@/store/useDicomStore';
import { useTranslator } from '@/i18n';

const METADATA_ROWS = [
  ['metadata.patient', 'patientName'],
  ['metadata.patientId', 'patientId'],
  ['metadata.modality', 'modality'],
  ['metadata.studyDate', 'studyDate'],
  ['metadata.study', 'studyDescription'],
  ['metadata.protocol', 'protocolName'],
  ['metadata.series', 'seriesDescription'],
  ['metadata.seriesNumber', 'seriesNumber'],
  ['metadata.instanceNumber', 'instanceNumber'],
  ['metadata.sliceThickness', 'sliceThickness'],
  ['metadata.pixelSpacing', 'pixelSpacing'],
  ['metadata.rescaleType', 'rescaleType'],
  ['metadata.manufacturer', 'manufacturer'],
  ['metadata.model', 'manufacturerModelName'],
  ['metadata.rows', 'rows'],
  ['metadata.columns', 'columns'],
  ['metadata.characterSet', 'specificCharacterSet'],
  ['metadata.transferSyntax', 'transferSyntaxUID']
] as const;

export function MetadataPanel() {
  const metadata = useActiveDicomMetadata();
  const t = useTranslator();

  return (
    <section className="tool-section">
      <h2>{t('metadata.heading')}</h2>
      {!metadata ? (
        <p className="empty-state">{t('metadata.emptyState')}</p>
      ) : (
        <dl className="metadata-list">
          {METADATA_ROWS.map(([label, key]) => (
            <div key={key}>
              <dt>{t(label)}</dt>
              <dd>{String(metadata[key] ?? t('metadata.unknown'))}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
