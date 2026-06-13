import { useMemo } from 'react';
import { create } from 'zustand';

import { createAppError, type AppErrorCode } from '@/utils/errors';

import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, normalizeLocale, type Locale } from './locale';
import { MESSAGES, type TranslationKey, type TranslationParams } from './messages';

export interface LocalizedText {
  key: TranslationKey;
  params?: TranslationParams;
}

export interface LocaleState {
  locale: Locale;
  setLocale(locale: Locale): void;
}

const missingKeyWarnings = new Set<string>();

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: readStoredLocale(),
  setLocale: (locale) => {
    const normalized = normalizeLocale(locale);
    persistLocale(normalized);
    set({ locale: normalized });
  }
}));

export function getCurrentLocale(): Locale {
  return useLocaleStore.getState().locale;
}

export function createTranslator(locale: Locale): Translator {
  return (key, params) => translate(locale, key, params);
}

export function useTranslator(): Translator {
  const locale = useLocaleStore((state) => state.locale);
  return useMemo(() => createTranslator(locale), [locale]);
}

export type Translator = (
  key: TranslationKey,
  params?: TranslationParams
) => string;

export function translate(
  locale: Locale,
  key: TranslationKey,
  params?: TranslationParams
): string {
  const template = MESSAGES[locale][key] ?? MESSAGES[DEFAULT_LOCALE][key];

  if (!template) {
    warnMissingKey(locale, key);
    return key;
  }

  return formatTemplate(template, params);
}

export function createLocalizedText(
  key: TranslationKey,
  params?: TranslationParams
): LocalizedText {
  return { key, ...(params ? { params } : {}) };
}

export function formatLocalizedText(
  locale: Locale,
  text: string | LocalizedText | undefined
): string {
  if (text === undefined) {
    return '';
  }

  if (typeof text === 'string') {
    return text;
  }

  return translate(locale, text.key, text.params);
}

export function createLocalizedAppError(
  locale: Locale,
  code: AppErrorCode,
  key: TranslationKey,
  params?: TranslationParams,
  options: { fileId?: string; cause?: unknown } = {}
) {
  return createAppError(code, translate(locale, key, params), options);
}

export function syncDocumentLocale(locale: Locale): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
    document.title = translate(locale, 'app.htmlTitle');
  }
}

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  try {
    return normalizeLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
  } catch {
    return DEFAULT_LOCALE;
  }
}

function persistLocale(locale: Locale): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Best effort only.
  }
}

function formatTemplate(template: string, params?: TranslationParams): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, token: string) => {
    const value = params[token];
    return value === undefined || value === null ? '' : String(value);
  });
}

function warnMissingKey(locale: Locale, key: TranslationKey): void {
  const meta = import.meta as ImportMeta & { env?: { DEV?: boolean } };
  if (!meta.env?.DEV) {
    return;
  }

  const warningKey = `${locale}:${key}`;
  if (missingKeyWarnings.has(warningKey)) {
    return;
  }

  missingKeyWarnings.add(warningKey);
  console.warn(`Missing translation key for ${locale}: ${key}`);
}
