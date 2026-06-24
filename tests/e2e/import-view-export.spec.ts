import { expect, test } from '@playwright/test';

test('opens the local DICOM tool shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Local DICOM JPEG Tool' })).toBeVisible();
  await expect(page.getByRole('button', { name: '选择 DICOM 文件' })).toBeVisible();
  await expect(page.getByTestId('dicom-viewport')).toContainText('未选择 DICOM');
  await expect(page.getByRole('button', { name: '选择导出文件夹' })).toBeVisible();
  await expect(page.getByRole('button', { name: '开始批量导出' })).toBeVisible();
  await expect(page.getByText('当前会把 PatientName / PatientID 烧录到 JPEG。')).toBeVisible();
});

test('keeps the active mobile panel after a shell rerender', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const bottomTabs = page.locator('.bottom-tab-bar');
  const exportTab = bottomTabs.locator('.bottom-tab-btn').nth(2);
  const rightPanel = page.locator('.right-panel');

  await exportTab.click();

  await expect(rightPanel).toBeVisible();
  await expect(exportTab).toHaveClass(/bottom-tab-btn--active/);

  await page.getByLabel('语言').selectOption('en');

  await expect(rightPanel).toBeVisible();
  await expect(exportTab).toHaveClass(/bottom-tab-btn--active/);
});
