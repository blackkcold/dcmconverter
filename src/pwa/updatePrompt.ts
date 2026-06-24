import { registerSW } from 'virtual:pwa-register';

export function registerPWA(): void {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    const updateSW = registerSW({
      onNeedRefresh() {
        if (window.confirm('New version available. Update now?')) {
          updateSW(true);
        }
      },
      onOfflineReady() {
        /* no-op */
      },
    });
  }
}
