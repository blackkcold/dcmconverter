import { expect, test } from '@playwright/test';

const pwaPreview = process.env.TEST_PWA_PREVIEW;
const pwaPath = process.env.TEST_PWA_PATH ?? '/';

test.skip(!pwaPreview, 'Set TEST_PWA_PREVIEW=1 to run PWA tests against a production preview build');

if (pwaPreview) {
  test('PWA: registers service worker and serves offline shell', async ({ page, context }) => {
    await page.goto(pwaPath);

    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();

    const isControlled = await page.evaluate(
      () => navigator.serviceWorker?.controller !== null,
    );
    expect(isControlled).toBe(true);

    await context.setOffline(true);
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Local DICOM JPEG Tool' })).toBeVisible();
    await expect(page.getByText('未选择 DICOM')).toBeVisible();

    await context.setOffline(false);
  });
}
