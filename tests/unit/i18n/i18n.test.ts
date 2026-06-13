import { afterEach, describe, expect, it } from 'vitest';

import {
  createLocalizedAppError,
  createLocalizedText,
  createTranslator,
  formatLocalizedText,
  syncDocumentLocale,
  translate,
  useLocaleStore
} from '@/i18n';

describe('i18n', () => {
  afterEach(() => {
    useLocaleStore.getState().setLocale('zh-CN');
    window.localStorage.clear();
  });

  it('falls back to Chinese and interpolates placeholders', () => {
    expect(translate('zh-CN', 'app.files', { count: 3 })).toBe('3 个文件');
    expect(translate('en', 'app.files', { count: 3 })).toBe('3 files');
  });

  it('creates localized text helpers that reformat against a locale', () => {
    const text = createLocalizedText('export.completed', {
      success: 1,
      failed: 2,
      skipped: 3
    });

    expect(formatLocalizedText('en', text)).toBe(
      'Export complete: success 1, failed 2, skipped 3.'
    );
    expect(formatLocalizedText('zh-CN', text)).toBe(
      '导出完成：成功 1，失败 2，跳过 3。'
    );
  });

  it('persists locale changes and syncs document language', () => {
    useLocaleStore.getState().setLocale('en');

    expect(useLocaleStore.getState().locale).toBe('en');
    expect(window.localStorage.getItem('dcmconverter.locale')).toBe('en');

    syncDocumentLocale('en');
    expect(document.documentElement.lang).toBe('en');
    expect(document.title).toBe('Local DICOM JPEG Tool');
  });

  it('builds localized app errors', () => {
    const error = createLocalizedAppError(
      'en',
      'ZIP_EXPORT_FAILED',
      'error.failedToCreateZipArchive'
    );

    expect(error.code).toBe('ZIP_EXPORT_FAILED');
    expect(error.message).toBe('Failed to create ZIP archive');
  });

  it('creates reusable translator functions', () => {
    const t = createTranslator('zh-CN');

    expect(t('locale.switcherLabel')).toBe('语言');
  });
});

