# Release Checklist / 发布检查清单

- [ ] `npm ci` / Install dependencies.
- [ ] `npm run typecheck` / Run type checks.
- [ ] `npm run lint` / Run lint checks.
- [ ] `npm run test` / Run the test suite.
- [ ] `npm run build` / Build the app.
- [ ] `VITE_BASE_PATH=/dcmconverter/ npm run build` / Verify GitHub Pages base-path PWA output.
- [ ] Playwright browsers installed / Install Playwright browsers.
- [ ] `npm run test:e2e` / Run E2E tests.
- [ ] `TEST_PWA_PREVIEW=1 TEST_PWA_PATH=/ npx playwright test tests/e2e/pwa-smoke.spec.ts --project=chromium` against `npm run preview` / Verify production PWA service worker and offline app shell.
- [ ] 确认 Cache Storage 只包含应用壳/构建资源，不包含 DICOM 文件名、DICOM 像素数据或导出结果 / Confirm Cache Storage only contains app-shell/build assets, not DICOM filenames, DICOM pixel data, or export outputs.
- [ ] 使用公开去标识化 DICOM fixture 手动验证 / Manually verify with public de-identified DICOM fixtures.
- [ ] 确认导出包名称、JPEG 文件名模板、folder export / ZIP 根目录前缀和 manifest / report 位置正确 / Confirm the export package name, JPEG filename template, folder export / ZIP root prefix, and manifest / report placement.
- [ ] 确认 README 隐私与非诊断声明仍准确 / Confirm the README privacy and non-diagnostic statements are still correct.
- [ ] 确认没有真实患者数据进入仓库 / Confirm no real patient data entered the repository.
