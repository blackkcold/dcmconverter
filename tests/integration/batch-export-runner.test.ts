import { describe, expect, it, vi } from 'vitest';

import type { LocalDicomFile } from '@/dicom/dicomTypes';
import { SerialBatchExportRunner } from '@/export/batchExportRunner';
import { DEFAULT_EXPORT_OPTIONS } from '@/export/exportTypes';

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
      callback(new Blob(['jpeg'], { type: 'image/jpeg' }))
    )
  } as unknown as HTMLCanvasElement;
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
        sourceRelativePath: 'a.dcm',
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
        sourceRelativePath: 'b.dcm',
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
});
