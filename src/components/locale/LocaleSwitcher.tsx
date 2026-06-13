import { LOCALES, type Locale, useLocaleStore, useTranslator } from '@/i18n';

export function LocaleSwitcher() {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const t = useTranslator();

  return (
    <label className="locale-switcher">
      <span className="locale-switcher-label">{t('locale.switcherLabel')}</span>
      <select
        aria-label={t('locale.switcherLabel')}
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
      >
        {LOCALES.map((value) => (
          <option key={value} value={value}>
            {value === 'zh-CN' ? t('locale.chinese') : t('locale.english')}
          </option>
        ))}
      </select>
    </label>
  );
}

