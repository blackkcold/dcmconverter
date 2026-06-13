# Local DICOM JPEG Tool

## 简介 / Overview
本项目是一个本地优先的浏览器端 DICOM 查看与 JPEG 导出工具。文件只在浏览器内处理，不上传服务器；导出的 JPEG 是非诊断用途的当前渲染结果。

This project is a local-first browser tool for viewing DICOM files and exporting JPEG images. Files are processed entirely in the browser and are never uploaded to a server; exported JPEGs are the current rendered view for non-diagnostic use.

## 在线访问 / Online
- 在线体验：<https://blackkcold.github.io/dcmconverter/>
- 发布页：<https://github.com/blackkcold/dcmconverter/releases>

- Live demo: <https://blackkcold.github.io/dcmconverter/>
- Releases: <https://github.com/blackkcold/dcmconverter/releases>

## 功能范围 / Features
- 选择单个或多个 `.dcm / .dicom / .ima` 文件。
- 通过目录选择器递归导入本地目录，并保留 `webkitRelativePath`。
- 使用 Cornerstone3D 渲染本地 DICOM 文件。
- 查看标准化 metadata，避免 UI 暴露原始 DICOM tag key。
- 串行分批导出当前图像、当前序列或全部导入文件。
- Chrome/Edge 支持选择目标文件夹逐张写入 JPEG，并用 manifest 断点继续。
- 不支持文件夹写入的浏览器会退回 ZIP 下载。
- 导出面板可设置导出包名称和 JPEG 文件名模板，模板只提供主字段组合。
- 默认可烧录个人医疗信息；导出面板会明确提示当前模式。

- Select one or more `.dcm / .dicom / .ima` files.
- Recursively import a local folder via the directory picker while preserving `webkitRelativePath`.
- Render local DICOM files with Cornerstone3D.
- Review normalized metadata without exposing raw DICOM tag keys in the UI.
- Export the current image, current series, or all imported files in serial batches.
- Chrome/Edge can write JPEGs directly into a target folder and resume via a manifest.
- Browsers without folder write support fall back to ZIP download.
- The export panel lets you set the export package name and JPEG filename template; templates are limited to main-field combinations.
- Personal health information can be burned in by default; the export panel clearly shows the current mode.

## 本地运行 / Local Development
```bash
npm install
npm run dev
```

打开 `http://127.0.0.1:5173`。

Open `http://127.0.0.1:5173`.

## 验证命令 / Verification
```bash
npm run typecheck
npm run lint
npm run test
npm run build
npx playwright --version
```

如需 E2E：

```bash
npx playwright install chromium
npm run test:e2e
```

For E2E:

```bash
npx playwright install chromium
npm run test:e2e
```

## 重要说明 / Notes
- V1 只承诺标准 DICOM P10 文件，不承诺支持全部 Transfer Syntax。
- 不支持静默扫描本地磁盘路径，必须由用户通过文件/目录选择器授权。
- 默认个人使用导出：可烧录 `PatientName` / `PatientID`。关闭“包含个人信息”后，匿名规则生效。
- 文件名模板只暴露主字段白名单，不支持自由文本拼接。
- JPEG 底部固定显示：`Non-diagnostic JPEG · Exported from local DICOM tool`。

- V1 only targets standard DICOM P10 files and does not promise support for every Transfer Syntax.
- Silent local-disk scanning is not supported; the user must explicitly authorize access through file or directory pickers.
- Personal-use export defaults to burning in `PatientName` / `PatientID`. Turning off “Include personal information” enables anonymous rules.
- Filename templates only expose the main-field whitelist and do not allow free-text composition.
- The JPEG footer always shows: `Non-diagnostic JPEG · Exported from local DICOM tool`.

## 回滚 / Rollback
本次构建在分支 `codex/build-local-dicom-jpeg-tool` 上完成。若需要回到初始状态，可切回 `main` 分支；未提交前也可用 git 查看和选择性删除新增文件。

This build was completed on branch `codex/build-local-dicom-jpeg-tool`. To return to the initial state, switch back to `main`; before committing, you can also inspect and selectively remove new files with git.
