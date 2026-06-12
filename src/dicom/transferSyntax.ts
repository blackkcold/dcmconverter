export const SUPPORTED_TRANSFER_SYNTAXES = new Set<string>([
  '1.2.840.10008.1.2',
  '1.2.840.10008.1.2.1',
  '1.2.840.10008.1.2.1.99',
  '1.2.840.10008.1.2.4.50',
  '1.2.840.10008.1.2.4.57',
  '1.2.840.10008.1.2.4.70',
  '1.2.840.10008.1.2.4.80',
  '1.2.840.10008.1.2.4.81',
  '1.2.840.10008.1.2.4.90',
  '1.2.840.10008.1.2.4.91',
  '1.2.840.10008.1.2.5'
]);

export function isSupportedTransferSyntax(uid?: string): boolean {
  if (!uid) {
    return false;
  }

  return SUPPORTED_TRANSFER_SYNTAXES.has(uid.trim());
}

export function getUnsupportedTransferSyntaxMessage(): string {
  return [
    '该 DICOM 文件使用当前版本暂不支持的 Transfer Syntax。',
    '文件未损坏，但当前浏览器端解码器无法处理。',
    '请尝试未压缩 DICOM、JPEG Baseline、JPEG-LS、JPEG 2000 或 RLE 格式。'
  ].join(' ');
}
