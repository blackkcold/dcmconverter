import { describe, expect, it } from 'vitest';

import type { LocalDicomFile } from '@/dicom/dicomTypes';
import { DEFAULT_EXPORT_OPTIONS } from '@/export/exportTypes';
import { buildExportJobs, splitIntoBatches } from '@/export/exportJobBuilder';

function localFile(id: string, relativePath: string): LocalDicomFile {
  return {
    id,
    file: new File(['DICM'], relativePath.split('/').at(-1) ?? 'scan.dcm'),
    name: relativePath,
    size: 4,
    relativePath,
    lastModified: 1
  };
}

describe('exportJobBuilder', () => {
  it('sorts export jobs by DICOM order and relative path', () => {
    const first = localFile('first', 'study/2.dcm');
    const second = localFile('second', 'study/1.dcm');
    const result = buildExportJobs({
      files: [first, second],
      studies: [],
      activeFileId: 'first',
      options: { ...DEFAULT_EXPORT_OPTIONS, scope: 'all', batchSize: 25 },
      metadataByFileId: {
        first: { studyDate: '20260612', seriesNumber: 2, instanceNumber: 2 },
        second: { studyDate: '20260612', seriesNumber: 2, instanceNumber: 1 }
      }
    });

    expect(result.jobs.map((job) => job.fileId)).toEqual(['second', 'first']);
  });

  it('splits jobs into stable batches', () => {
    expect(splitIntoBatches([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('keeps patient identifiers out of file names regardless of personal-info mode', () => {
    const file = localFile('file_a', 'a.dcm');
    const withPersonalInfo = buildExportJobs({
      files: [file],
      studies: [],
      activeFileId: file.id,
      options: {
        ...DEFAULT_EXPORT_OPTIONS,
        scope: 'all',
        includePersonalInfo: true
      },
      metadataByFileId: {
        [file.id]: { studyDate: '20260612', patientId: 'PID-1', modality: 'CT' }
      }
    });
    const anonymous = buildExportJobs({
      files: [file],
      studies: [],
      activeFileId: file.id,
      options: {
        ...DEFAULT_EXPORT_OPTIONS,
        scope: 'all',
        includePersonalInfo: false
      },
      metadataByFileId: {
        [file.id]: { studyDate: '20260612', patientId: 'PID-1', modality: 'CT' }
      }
    });

    expect(withPersonalInfo.jobs[0]?.outputFileName).toBe(
      '0001_20260612_CT_Sunknown_Iunknown.jpg'
    );
    expect(anonymous.jobs[0]?.outputFileName).toBe(
      '0001_20260612_CT_Sunknown_Iunknown.jpg'
    );
  });

  it('changes options hashes when naming configuration changes', () => {
    const file = localFile('file_a', 'a.dcm');
    const base = buildExportJobs({
      files: [file],
      studies: [],
      activeFileId: file.id,
      options: { ...DEFAULT_EXPORT_OPTIONS, scope: 'all' },
      metadataByFileId: {
        [file.id]: { studyDate: '20260612', modality: 'CT' }
      }
    });
    const renamed = buildExportJobs({
      files: [file],
      studies: [],
      activeFileId: file.id,
      options: {
        ...DEFAULT_EXPORT_OPTIONS,
        scope: 'all',
        exportPackageName: 'custom-pack',
        fileNameTemplateMode: 'fields',
        fileNameTemplateFields: ['studyDate', 'modality']
      },
      metadataByFileId: {
        [file.id]: { studyDate: '20260612', modality: 'CT' }
      }
    });

    expect(base.optionsHash).not.toBe(renamed.optionsHash);
  });

  it('creates legacy series folders and directory-local sequence prefixes when requested', () => {
    const first = localFile('file_a', 'source/a.dcm');
    const second = localFile('file_b', 'source/b.dcm');
    const result = buildExportJobs({
      files: [first, second],
      studies: [],
      activeFileId: first.id,
      options: {
        ...DEFAULT_EXPORT_OPTIONS,
        scope: 'all',
        includePersonalInfo: false,
        outputLayout: 'series'
      },
      metadataByFileId: {
        [first.id]: {
          studyDate: '20260612',
          studyInstanceUID: '1.2.3.4',
          seriesInstanceUID: '9.8.7.6',
          seriesNumber: 3,
          modality: 'CT',
          instanceNumber: 1
        },
        [second.id]: {
          studyDate: '20260612',
          studyInstanceUID: '1.2.3.4',
          seriesInstanceUID: '9.8.7.6',
          seriesNumber: 3,
          modality: 'CT',
          instanceNumber: 2
        }
      }
    });

    expect(result.jobs.map((job) => job.outputRelativePath)).toEqual([
      'dicom-jpeg-export/Study_20260612_1.2.3.4/S003_CT_9.8.7.6/0001_20260612_CT_S003_I0001.jpg',
      'dicom-jpeg-export/Study_20260612_1.2.3.4/S003_CT_9.8.7.6/0002_20260612_CT_S003_I0002.jpg'
    ]);
  });

  it('uses DICOM smart folders by default and preserves Chinese path segments', () => {
    const file = localFile('file_a', 'source/a.dcm');
    const result = buildExportJobs({
      files: [file],
      studies: [],
      activeFileId: file.id,
      options: {
        ...DEFAULT_EXPORT_OPTIONS,
        scope: 'all',
        includePersonalInfo: false
      },
      metadataByFileId: {
        [file.id]: {
          studyDate: '20260612',
          studyInstanceUID: '1.2.3.4',
          seriesInstanceUID: '9.8.7.6',
          protocolName: '腹部平扫+薄层',
          seriesDescription: '腹窗 cor&sag 5mm',
          seriesNumber: 3,
          modality: 'CT',
          instanceNumber: 1
        }
      }
    });

    expect(result.jobs[0]?.outputRelativePath).toBe(
      'dicom-jpeg-export/Study_20260612_1.2.3.4/Protocol_腹部平扫+薄层/S003_腹窗_cor&sag_5mm_9.8.7.6/0001_20260612_CT_S003_I0001.jpg'
    );
  });

  it('can group folders by individual metadata fields', () => {
    const file = localFile('file_a', 'source/a.dcm');
    const metadataByFileId = {
      [file.id]: {
        studyDate: '20260612',
        seriesDescription: '腹窗 cor&sag 5mm',
        protocolName: '腹部平扫+薄层',
        instanceNumber: 54
      }
    };
    const base = {
      files: [file],
      studies: [],
      activeFileId: file.id,
      options: {
        ...DEFAULT_EXPORT_OPTIONS,
        scope: 'all' as const,
        outputLayout: 'metadataField' as const,
        includePersonalInfo: false
      },
      metadataByFileId
    };

    expect(
      buildExportJobs({
        ...base,
        options: { ...base.options, metadataFolderField: 'seriesDescription' }
      }).jobs[0]?.outputRelativePath
    ).toBe(
      'dicom-jpeg-export/Study_20260612_unknown/SeriesDescription_腹窗_cor&sag_5mm/0001_20260612_unknown_Sunknown_I0054.jpg'
    );
    expect(
      buildExportJobs({
        ...base,
        options: { ...base.options, metadataFolderField: 'protocolName' }
      }).jobs[0]?.outputRelativePath
    ).toBe(
      'dicom-jpeg-export/Study_20260612_unknown/Protocol_腹部平扫+薄层/0001_20260612_unknown_Sunknown_I0054.jpg'
    );
    expect(
      buildExportJobs({
        ...base,
        options: { ...base.options, metadataFolderField: 'instanceNumber' }
      }).jobs[0]?.outputRelativePath
    ).toBe(
      'dicom-jpeg-export/Study_20260612_unknown/Instance_0054/0001_20260612_unknown_Sunknown_I0054.jpg'
    );
  });

  it('can preserve source directories or flatten output', () => {
    const file = localFile('file_a', 'import/sub/a.dcm');
    const metadataByFileId = {
      [file.id]: { studyDate: '20260612', modality: 'CT', instanceNumber: 1 }
    };
    const source = buildExportJobs({
      files: [file],
      studies: [],
      activeFileId: file.id,
      options: {
        ...DEFAULT_EXPORT_OPTIONS,
        scope: 'all',
        includePersonalInfo: false,
        outputLayout: 'source'
      },
      metadataByFileId
    });
    const flat = buildExportJobs({
      files: [file],
      studies: [],
      activeFileId: file.id,
      options: {
        ...DEFAULT_EXPORT_OPTIONS,
        scope: 'all',
        includePersonalInfo: false,
        outputLayout: 'flat'
      },
      metadataByFileId
    });

    expect(source.jobs[0]?.outputRelativePath).toBe(
      'dicom-jpeg-export/import/sub/0001_20260612_CT_Sunknown_I0001.jpg'
    );
    expect(flat.jobs[0]?.outputRelativePath).toBe(
      'dicom-jpeg-export/0001_20260612_CT_Sunknown_I0001.jpg'
    );
  });
});
