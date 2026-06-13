import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';

import { syncDocumentLocale, useLocaleStore } from '@/i18n';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <>
      <LocaleEffects />
      {children}
    </>
  );
}

function LocaleEffects() {
  const locale = useLocaleStore((state) => state.locale);

  useEffect(() => {
    syncDocumentLocale(locale);
  }, [locale]);

  return null;
}
