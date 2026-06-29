# Architecture / 架构

## Module Boundaries / 模块边界

| Module / 模块 | Responsibility / 职责 |
|---|---|
| `src/dicom` | 文件导入、metadata 解析、Transfer Syntax 判断、Study 分组、Cornerstone 文件注册。<br>File ingest, metadata parsing, Transfer Syntax checks, Study grouping, and Cornerstone file registration. |
| `src/viewer` | Cornerstone 初始化、viewport 生命周期、窗宽窗位和 stack navigation。<br>Cornerstone initialization, viewport lifecycle, window/level, and stack navigation. |
| `src/export` | Canvas 克隆、overlay 烧录、JPEG 编码、ZIP 打包、共享命名规则与文件名模板。<br>Canvas cloning, overlay burn-in, JPEG encoding, ZIP packaging, and shared naming rules and filename templates. |
| `src/store` | DICOM、viewer、export 三类状态。<br>State for DICOM, viewer, and export concerns. |
| `src/components` | UI 展示和用户事件派发。<br>UI presentation and user event dispatch. |
| `src/pwa` | Service Worker 和生产环境 PWA 注册；只预缓存应用壳/构建产物，不处理用户 DICOM 数据。<br>Service worker and production PWA registration; precaches only app shell/build assets and does not handle user DICOM data. |

## Data Flow / 数据流

应用遵循“先导入、后解析、再分组、最后渲染/导出”的单向流程。<br>
The app follows a one-way flow: ingest first, then parse, then group, and finally render or export.

```text
File input / directory input
  -> ingestFiles()
  -> parseDicomMetadata()
  -> groupDicomFiles()
  -> DicomStudyTree / MetadataPanel / DicomViewport
  -> exportCanvasAsJpeg()
```

## Constraints / 约束

- React 组件不直接解析 DICOM tag。<br>React components do not parse DICOM tags directly.
- Cornerstone API 集中在 `dicom/cornerstoneInit.ts` 和 `viewer/viewportController.ts`。<br>Cornerstone APIs are centralized in `dicom/cornerstoneInit.ts` and `viewer/viewportController.ts`.
- 导出默认匿名，文件名模板只允许主字段白名单，敏感字段不进入文件名。<br>Export defaults to anonymized output, filename templates only allow the main-field whitelist, and sensitive fields never enter filenames.
- PWA 更新只提示用户手动确认，不自动刷新页面；Service Worker 不缓存 File/blob/file: 协议数据。<br>PWA updates are prompt/manual only, with no automatic reload; the service worker does not cache File/blob/file: protocol data.
