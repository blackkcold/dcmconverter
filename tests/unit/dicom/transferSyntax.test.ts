import { describe, expect, it } from 'vitest';

import {
  getUnsupportedTransferSyntaxMessage,
  isSupportedTransferSyntax
} from '@/dicom/transferSyntax';

describe('transferSyntax', () => {
  it('detects supported transfer syntax UIDs', () => {
    expect(isSupportedTransferSyntax('1.2.840.10008.1.2.1')).toBe(true);
    expect(isSupportedTransferSyntax('1.2.840.10008.1.2.4.90')).toBe(true);
  });

  it('rejects missing or unsupported transfer syntax UIDs', () => {
    expect(isSupportedTransferSyntax()).toBe(false);
    expect(isSupportedTransferSyntax('unsupported')).toBe(false);
  });

  it('returns a user-facing unsupported message', () => {
    expect(getUnsupportedTransferSyntaxMessage('en')).toContain('Transfer Syntax');
    expect(getUnsupportedTransferSyntaxMessage('zh-CN')).toContain('该 DICOM 文件');
  });
});
