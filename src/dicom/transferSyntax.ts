import { createTranslator, getCurrentLocale, type Locale } from '@/i18n';

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

export function getUnsupportedTransferSyntaxMessage(
  locale: Locale = getCurrentLocale()
): string {
  const t = createTranslator(locale);
  return t('error.transferSyntaxUnsupported');
}
