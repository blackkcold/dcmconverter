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
