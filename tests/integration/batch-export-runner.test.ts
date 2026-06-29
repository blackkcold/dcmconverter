import { describe, expect, it, vi } from 'vitest';

import type { LocalDicomFile } from '@/dicom/dicomTypes';
import { SerialBatchExportRunner } from '@/export/batchExportRunner';
import { DEFAULT_EXPORT_OPTIONS } from '@/export/exportTypes';
import type {
  FileSystemDirectoryHandleLike,
  WritableFileStreamLike
} from '@/export/fileSystemAccess';

function localFile(id: string): LocalDicomFile {
  return {
    id,
    file: new File(['DICM'], `${id}.dcm`),
    name: `${id}.dcm`,
    size: 4,
    relativePath: `${id}.dcm`,
    lastModified: 1
  };
}

function mockCanvas(): HTMLCanvasElement {
  return {
    width: 2,
    height: 2,
    getContext: vi.fn(() => null),
    toBlob: vi.fn((callback: BlobCallback) =>
      callback(
        new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' })
      )
    )
  } as unknown as HTMLCanvasElement;
}

class MockFileHandle {
  constructor(
    private readonly path: string,
    private readonly writes: Map<string, Blob | BufferSource | string>
  ) {}

  async getFile(): Promise<File> {
    return new File([], this.path);
  }

  async createWritable(): Promise<WritableFileStreamLike> {
    return {
      write: async (data) => {
        this.writes.set(this.path, data);
      },
      close: async () => undefined
    };
  }
}

class MockDirectoryHandle implements FileSystemDirectoryHandleLike {
  readonly directories = new Map<string, MockDirectoryHandle>();

  constructor(
    readonly name: string,
    private readonly path: string,
    private readonly writes: Map<string, Blob | BufferSource | string>
  ) {}

  async getFileHandle(name: string): Promise<MockFileHandle> {
    return new MockFileHandle(this.join(name), this.writes);
  }

  async getDirectoryHandle(name: string): Promise<MockDirectoryHandle> {
    const existing = this.directories.get(name);
    if (existing) {
      return existing;
    }

    const directory = new MockDirectoryHandle(name, this.join(name), this.writes);
    this.directories.set(name, directory);
    return directory;
  }

  private join(name: string): string {
    return this.path ? `${this.path}/${name}` : name;
  }
}

describe('SerialBatchExportRunner', () => {
  it('runs jobs serially and continues after a failed file', async () => {
    const started: string[] = [];
    let active = 0;
    let maxActive = 0;
    const files = [localFile('a'), localFile('b'), localFile('c')];
    const runner = new SerialBatchExportRunner({
      files,
      studies: [],
      metadataByFileId: {
        a: { instanceNumber: 1 },
        b: { instanceNumber: 2 },
        c: { instanceNumber: 3 }
      },
      options: {
        ...DEFAULT_EXPORT_OPTIONS,
        exportMode: 'zip',
        scope: 'all',
        batchSize: 2
      },
      renderer: async ({ localFile }) => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        started.push(localFile.id);
        await Promise.resolve();
        active -= 1;

        if (localFile.id === 'b') {
          throw new Error('Decode failed');
        }

        return mockCanvas();
      }
    });

    const result = await runner.run();

    expect(started).toEqual(['a', 'b', 'c']);
    expect(maxActive).toBe(1);
    expect(result.jobs.map((job) => job.status)).toEqual([
      'success',
      'failed',
      'success'
    ]);
    expect(result.zipBlob?.type).toBe('application/zip');
    expect(result.zipFileName).toBe('dicom-jpeg-export.zip');
  });

  it('can retry only failed jobs', async () => {
    const files = [localFile('a'), localFile('b')];
    const previousJobs = [
      {
        id: 'export_a',
        fileId: 'a',
        status: 'success' as const,
        batchIndex: 0,
        outputFileName: 'a.jpg',
        outputRelativePath: 'a.jpg',
        retryCount: 0,
        metadataHash: 'metadata',
        optionsHash: 'options'
      },
      {
        id: 'export_b',
        fileId: 'b',
        status: 'failed' as const,
        batchIndex: 0,
        outputFileName: 'b.jpg',
        outputRelativePath: 'b.jpg',
        retryCount: 1,
        metadataHash: 'metadata',
        optionsHash: 'options'
      }
    ];
    const rendered: string[] = [];
    const runner = new SerialBatchExportRunner({
      files,
      studies: [],
      metadataByFileId: {},
      options: { ...DEFAULT_EXPORT_OPTIONS, exportMode: 'zip', scope: 'all' },
      previousJobs,
      mode: 'failed',
      renderer: async ({ localFile }) => {
        rendered.push(localFile.id);
        return mockCanvas();
      }
    });

    const result = await runner.run();

    expect(rendered).toEqual(['b']);
    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0]?.retryCount).toBe(2);
  });

  it('writes folder exports to the job output relative path', async () => {
    const writes = new Map<string, Blob | BufferSource | string>();
    const directoryHandle = new MockDirectoryHandle('root', '', writes);
    const file = localFile('file_a');
    const runner = new SerialBatchExportRunner({
      files: [file],
      studies: [],
      metadataByFileId: {
        [file.id]: {
          studyDate: '20260612',
          studyInstanceUID: 'study-a',
          seriesInstanceUID: 'series-a',
          seriesNumber: 1,
          modality: 'CT',
          instanceNumber: 1
        }
      },
      options: {
        ...DEFAULT_EXPORT_OPTIONS,
        exportMode: 'folder',
        scope: 'all',
        includePersonalInfo: false,
        resumeMode: false
      },
      directoryHandle,
      renderer: async () => mockCanvas()
    });

    const result = await runner.run();

    expect(result.jobs[0]?.outputRelativePath).toBe(
      'dicom-jpeg-export/Study_20260612_study-a/Protocol_unknown/S001_unknown_series-a/0001_20260612_CT_S001_I0001.jpg'
    );
    expect(
      writes.has(
        'dicom-jpeg-export/Study_20260612_study-a/Protocol_unknown/S001_unknown_series-a/0001_20260612_CT_S001_I0001.jpg'
      )
    ).toBe(true);
    expect(
      writes.has('dicom-jpeg-export/.dcm-jpeg-export-manifest.json')
    ).toBe(true);
    expect(writes.has('dicom-jpeg-export/export-report.json')).toBe(true);
    expect(writes.has('dicom-jpeg-export/export-report.csv')).toBe(true);
  });
});
