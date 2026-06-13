import { describe, expect, it } from 'vitest';

import type {
  FileSystemDirectoryHandleLike,
  WritableFileStreamLike
} from '@/export/fileSystemAccess';
import {
  readTextFromDirectory,
  writeBlobToDirectory
} from '@/export/fileSystemAccess';

class MockFileHandle {
  constructor(
    private readonly path: string,
    private readonly writes: Map<string, Blob | BufferSource | string>
  ) {}

  async getFile(): Promise<File> {
    const contents = this.writes.get(this.path);
    const text =
      contents instanceof Blob
        ? await contents.text()
        : typeof contents === 'string'
          ? contents
          : contents
            ? String(contents)
            : '';

    return {
      text: async () => text
    } as unknown as File;
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

describe('fileSystemAccess', () => {
  it('creates nested directories before writing files', async () => {
    const writes = new Map<string, Blob | BufferSource | string>();
    const root = new MockDirectoryHandle('root', '', writes);
    const blob = new Blob(['jpeg'], { type: 'image/jpeg' });

    await writeBlobToDirectory(root, 'Study/S001/0001_scan.jpg', blob);

    expect(root.directories.has('Study')).toBe(true);
    expect(root.directories.get('Study')?.directories.has('S001')).toBe(true);
    expect(writes.get('Study/S001/0001_scan.jpg')).toBe(blob);
  });

  it('can read nested text files by relative path', async () => {
    const writes = new Map<string, Blob | BufferSource | string>();
    const root = new MockDirectoryHandle('root', '', writes);

    await root.getDirectoryHandle('Study');
    writes.set('Study/report.json', '{"ok":true}');

    await expect(readTextFromDirectory(root, 'Study/report.json')).resolves.toBe(
      '{"ok":true}'
    );
  });
});
