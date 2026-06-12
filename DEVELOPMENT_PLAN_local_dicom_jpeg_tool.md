# Local DICOM JPEG Tool 开发方案（TDD + SDD 混合模式）

> 文件名建议：`DEVELOPMENT_PLAN.md`  
> 项目建议名：`local-dicom-jpeg-tool`  
> 最后核查日期：2026-06-12  
> 开发目标：本地 DICOM 文件/目录读取、基础医学影像查看、窗宽窗位、缩放拖拽、批量转 JPEG、关键信息烧录到 JPEG。  
> 产品边界：非诊断用途；不上传服务器；不修改原始 DICOM；不承诺支持所有 Transfer Syntax。

---

## 1. 需求冻结

### 1.1 V1 必做功能

| 编号 | 功能 | V1 范围 | 验收标准 |
|---:|---|---|---|
| F1 | 读取 `.dcm / DICOM` 文件 | 用户主动选择单个或多个本地文件 | 可导入标准 DICOM P10 文件，非 DICOM 自动跳过 |
| F2 | 读取本地目录 | 用户通过目录选择器授权读取目录 | 能递归读取目录内文件，保留 `webkitRelativePath` |
| F3 | 片子查看 | 窗宽窗位、缩放、拖拽、序列滚动 | 图像可显示、可调窗、可缩放、可平移、可滚动 |
| F4 | 批量转 JPEG | 当前图像、当前序列、全部导入文件 | 能生成 JPEG；批量导出 ZIP；失败不阻断整体任务 |
| F5 | 关键信息烧录到 JPEG | 将关键元数据绘制到边栏或底栏 | 匿名模式默认开启；关键信息显示稳定 |

### 1.2 V1 明确不做

| 不做项 | 原因 |
|---|---|
| 静默扫描本地磁盘路径 | 浏览器安全模型不允许 |
| 诊断级医学 Viewer | 涉及医疗器械合规、显示校准、审计要求 |
| DICOM 写回 / 修改原文件 | 与 JPEG 转换目标无关，风险高 |
| PACS / DICOMweb 接入 | 当前定位是本地工具 |
| 全量 DICOM 标签烧录进同一张 JPEG | 可读性差、Canvas 尺寸风险高、隐私风险高 |
| 自动 OCR 清除像素内患者信息 | V1 不承诺；仅提供风险提示 |

---

## 2. 最后一轮参考核查结论

### 2.1 官方与开源项目核查

| 来源 | 核查结论 | 本项目决策 |
|---|---|---|
| Cornerstone3D GitHub | Cornerstone3D 是构建 Web 医学影像应用的 JS 库，使用 WebGL 渲染、WebAssembly 解压，MIT License | 作为主渲染栈 |
| Cornerstone.js 官方文档 | 官方说明其具备 DICOM 解析、高性能 GPU 图像显示、多线程解码、模块化扩展能力 | 适合作为本地 DICOM Viewer 基座 |
| Cornerstone WADO local DICOM 示例 | 官方示例展示从本地选择 DICOM P10 并显示；同时说明浏览器不能直接读取文件系统，必须由用户选择文件 | 本地读取必须使用 file input / drag-drop / directory picker |
| OHIF Viewer | 零足迹 Web 医学影像 Viewer，PWA，可配置、可扩展，支持 DICOMweb | 仅作为架构参考，不直接引入 |
| DICOM 官方标准 | DICOM 用于医学影像信息传输、存储、检索、处理和显示；Part 10 约束文件格式，Part 15 约束安全和去标识化 | V1 只承诺标准 DICOM P10 文件；默认匿名导出 |
| MDN `webkitdirectory` | 允许用户选择目录，返回目录层级内文件，并通过 `File.webkitRelativePath` 保留相对路径 | 目录读取采用 `webkitdirectory multiple` |
| MDN `canvas.toBlob()` | 可将 Canvas 内容生成 Blob，支持指定 `image/jpeg` 与质量参数 | JPEG 导出采用 Canvas 渲染后 `toBlob('image/jpeg')` |
| Vite / Vitest / Playwright 官方文档 | Vite 支持 TS、JSX、Workers、WASM；Vitest 适配 Vite；Playwright 可跑 E2E 和 CI | 采用 Vite + Vitest + Playwright |

### 2.2 关键修正

1. **不采用 DWV 作为主栈**：DWV 可参考，但 GPL-3.0 许可证对闭源/商用不友好。
2. **不采用 OHIF 作为主工程**：OHIF 太重，适合完整 Viewer，不适合轻量本地转换工具。
3. **不承诺所有 Transfer Syntax**：即使 Cornerstone 官方能力强，也必须在产品层面保留“不支持则跳过并提示”的策略。
4. **目录读取不做路径输入**：统一通过用户选择文件夹授权读取。
5. **JPEG 明确非诊断用途**：导出的 JPEG 是当前窗宽窗位渲染结果，不等价于原始 DICOM。

---

## 3. 开发方法：TDD + SDD 混合模式

### 3.1 定义

| 方法 | 在本项目中的含义 |
|---|---|
| SDD：Spec-Driven Development | 每个功能先写规格文档、输入输出契约、错误码、验收条件 |
| TDD：Test-Driven Development | 每个模块先写失败测试，再实现，再重构 |
| 混合模式 | Feature 级别先 SDD，Module 级别严格 TDD，UI/E2E 用验收测试驱动 |

### 3.2 标准开发闭环

```text
Feature Spec
  ↓
Acceptance Criteria
  ↓
Type Contract
  ↓
Failing Unit Test
  ↓
Implementation
  ↓
Integration Test
  ↓
E2E Test
  ↓
Docs Update
  ↓
Refactor
```

### 3.3 每个功能的执行格式

每个功能必须按以下顺序开发：

```text
1. 写 docs/specs/Fx-xxx.md
2. 写类型定义：src/**/**Types.ts
3. 写单元测试：tests/unit/**/*.test.ts
4. 运行测试，确认失败
5. 实现最小代码
6. 再跑测试，确认通过
7. 写集成测试
8. 写 E2E 测试
9. 更新开发文档
10. PR / commit 前执行质量门禁
```

---

## 4. 项目初始化命令

### 4.1 创建项目

```bash
npm create vite@latest local-dicom-jpeg-tool -- --template react-ts
cd local-dicom-jpeg-tool
```

### 4.2 安装运行依赖

```bash
npm install @cornerstonejs/core @cornerstonejs/tools @cornerstonejs/dicom-image-loader @cornerstonejs/codecs dicom-parser zustand fflate
```

### 4.3 安装开发依赖

```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom playwright eslint prettier typescript vite-tsconfig-paths
```

### 4.4 初始化 Playwright

```bash
npm init playwright@latest
```

建议选择：

```text
- TypeScript
- tests/e2e
- Add GitHub Actions workflow: Yes
- Install browsers: Yes
```

---

## 5. 项目目录架构

```text
local-dicom-jpeg-tool/
├─ public/
│  └─ README_OFFLINE_USAGE.txt
│
├─ src/
│  ├─ app/
│  │  ├─ App.tsx
│  │  ├─ AppShell.tsx
│  │  └─ providers/
│  │
│  ├─ components/
│  │  ├─ file-import/
│  │  │  ├─ FileImportPanel.tsx
│  │  │  └─ FileImportPanel.test.tsx
│  │  ├─ study-tree/
│  │  │  ├─ DicomStudyTree.tsx
│  │  │  └─ DicomStudyTree.test.tsx
│  │  ├─ viewer/
│  │  │  ├─ DicomViewport.tsx
│  │  │  ├─ ViewerToolbar.tsx
│  │  │  └─ ViewerToolbar.test.tsx
│  │  ├─ metadata/
│  │  │  ├─ MetadataPanel.tsx
│  │  │  └─ MetadataPanel.test.tsx
│  │  └─ export/
│  │     ├─ ExportPanel.tsx
│  │     └─ JobProgressPanel.tsx
│  │
│  ├─ dicom/
│  │  ├─ cornerstoneInit.ts
│  │  ├─ fileIngest.ts
│  │  ├─ dicomFileManager.ts
│  │  ├─ metadataParser.ts
│  │  ├─ metadataMap.ts
│  │  ├─ seriesGrouper.ts
│  │  ├─ transferSyntax.ts
│  │  └─ dicomTypes.ts
│  │
│  ├─ viewer/
│  │  ├─ viewportController.ts
│  │  ├─ viewportTools.ts
│  │  ├─ windowLevel.ts
│  │  ├─ stackNavigation.ts
│  │  └─ viewerTypes.ts
│  │
│  ├─ export/
│  │  ├─ exportController.ts
│  │  ├─ canvasRenderer.ts
│  │  ├─ overlayRenderer.ts
│  │  ├─ jpegEncoder.ts
│  │  ├─ fileNamer.ts
│  │  ├─ zipExporter.ts
│  │  └─ exportTypes.ts
│  │
│  ├─ workers/
│  │  ├─ export.worker.ts
│  │  └─ metadata.worker.ts
│  │
│  ├─ store/
│  │  ├─ useDicomStore.ts
│  │  ├─ useViewerStore.ts
│  │  └─ useExportStore.ts
│  │
│  ├─ utils/
│  │  ├─ assert.ts
│  │  ├─ errors.ts
│  │  ├─ logger.ts
│  │  └─ result.ts
│  │
│  └─ main.tsx
│
├─ docs/
│  ├─ README_PRODUCT.md
│  ├─ ARCHITECTURE.md
│  ├─ DICOM_SCOPE.md
│  ├─ EXPORT_SPEC.md
│  ├─ CODE_STYLE.md
│  ├─ TEST_PLAN.md
│  ├─ SECURITY_PRIVACY.md
│  ├─ ERROR_HANDLING.md
│  ├─ RELEASE_CHECKLIST.md
│  ├─ specs/
│  │  ├─ F1-file-ingest.md
│  │  ├─ F2-directory-ingest.md
│  │  ├─ F3-viewer.md
│  │  ├─ F4-jpeg-export.md
│  │  └─ F5-overlay-burn-in.md
│  └─ adr/
│     ├─ 0001-use-cornerstone3d.md
│     ├─ 0002-use-sdd-tdd.md
│     ├─ 0003-use-canvas-jpeg-export.md
│     └─ 0004-directory-access-boundary.md
│
├─ tests/
│  ├─ unit/
│  │  ├─ dicom/
│  │  ├─ export/
│  │  └─ utils/
│  ├─ integration/
│  │  ├─ ingest-to-grouping.test.ts
│  │  ├─ metadata-to-overlay.test.ts
│  │  └─ export-pipeline.test.ts
│  ├─ e2e/
│  │  ├─ import-view-export.spec.ts
│  │  └─ anonymous-export.spec.ts
│  └─ fixtures/
│     ├─ README.md
│     └─ dicom/
│
├─ .github/
│  └─ workflows/
│     └─ ci.yml
│
├─ package.json
├─ vite.config.ts
├─ vitest.config.ts
├─ playwright.config.ts
├─ tsconfig.json
├─ eslint.config.js
├─ prettier.config.js
└─ README.md
```

---

## 6. 核心代码规范

### 6.1 TypeScript 强制配置

`tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "useUnknownInCatchVariables": true,
    "noFallthroughCasesInSwitch": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@tests/*": ["tests/*"]
    }
  },
  "include": ["src", "tests", "vite.config.ts", "vitest.config.ts", "playwright.config.ts"],
  "references": []
}
```

### 6.2 禁止事项

| 禁止项 | 说明 |
|---|---|
| 禁止 `any` | 使用 `unknown` 后收窄 |
| 禁止 UI 组件直接解析 DICOM tag | UI 只能消费 `DicomMetadata` |
| 禁止业务逻辑写在 React 组件中 | 业务逻辑进入 `dicom/`、`viewer/`、`export/` |
| 禁止静默 catch | 所有异常转成 `AppError` |
| 禁止直接烧录敏感患者信息 | 匿名模式默认开启 |
| 禁止将原始 DICOM 上传网络 | V1 不设计网络上传能力 |
| 禁止在没有测试的情况下实现核心模块 | 每个核心模块必须先写测试 |
| 禁止把 Cornerstone API 散落在组件里 | 统一封装在 `viewer/viewportController.ts` |

### 6.3 命名规则

| 类型 | 规则 | 示例 |
|---|---|---|
| 文件 | camelCase | `metadataParser.ts` |
| React 组件 | PascalCase | `FileImportPanel.tsx` |
| 类型/接口 | PascalCase | `DicomMetadata` |
| 函数 | camelCase | `parseDicomMetadata` |
| 常量 | SCREAMING_SNAKE_CASE | `SUPPORTED_TRANSFER_SYNTAXES` |
| 错误码 | 模块前缀 | `DICOM_PARSE_FAILED` |

---

## 7. 基础类型契约

### 7.1 Result 类型

`src/utils/result.ts`：

```ts
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
```

### 7.2 错误类型

`src/utils/errors.ts`：

```ts
export type AppErrorCode =
  | 'FILE_NOT_DICOM'
  | 'FILE_READ_FAILED'
  | 'DICOM_PARSE_FAILED'
  | 'DICOM_UNSUPPORTED_TRANSFER_SYNTAX'
  | 'DICOM_DECODE_FAILED'
  | 'VIEWPORT_INIT_FAILED'
  | 'VIEWPORT_RENDER_FAILED'
  | 'JPEG_EXPORT_FAILED'
  | 'ZIP_EXPORT_FAILED'
  | 'PRIVACY_RULE_VIOLATION';

export interface AppError {
  code: AppErrorCode;
  message: string;
  fileId?: string;
  cause?: unknown;
}
```

### 7.3 DICOM 类型

`src/dicom/dicomTypes.ts`：

```ts
export interface LocalDicomFile {
  id: string;
  file: File;
  name: string;
  size: number;
  relativePath: string;
  lastModified: number;
}

export interface DicomMetadata {
  patientName?: string;
  patientId?: string;
  patientSex?: string;
  patientAge?: string;

  studyInstanceUID?: string;
  studyDate?: string;
  studyTime?: string;
  studyDescription?: string;

  seriesInstanceUID?: string;
  seriesNumber?: number;
  seriesDescription?: string;
  modality?: string;

  sopInstanceUID?: string;
  instanceNumber?: number;

  rows?: number;
  columns?: number;
  windowCenter?: number;
  windowWidth?: number;
  rescaleSlope?: number;
  rescaleIntercept?: number;
  transferSyntaxUID?: string;
}

export interface DicomStudy {
  studyInstanceUID: string;
  description?: string;
  date?: string;
  series: DicomSeries[];
}

export interface DicomSeries {
  seriesInstanceUID: string;
  seriesNumber?: number;
  description?: string;
  modality?: string;
  instances: DicomInstance[];
}

export interface DicomInstance {
  fileId: string;
  sopInstanceUID?: string;
  instanceNumber?: number;
  metadata: DicomMetadata;
}
```

### 7.4 导出类型

`src/export/exportTypes.ts`：

```ts
export interface ExportOptions {
  scope: 'current' | 'series' | 'all';
  jpegQuality: number;
  includeOverlay: boolean;
  anonymizeOverlay: boolean;
  overlayPosition: 'right' | 'bottom';
  useCurrentWindowLevel: boolean;
}

export interface ExportJob {
  id: string;
  fileId: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  errorMessage?: string;
}

export interface JpegExportResult {
  fileName: string;
  blob: Blob;
  fileId: string;
}
```

---

## 8. SDD 规格文件模板

每个功能必须先写 `docs/specs/Fx-xxx.md`。

模板：

```md
# Fx 功能规格：功能名称

## 1. 目标

## 2. 非目标

## 3. 输入

## 4. 输出

## 5. 类型契约

## 6. 错误码

## 7. 隐私规则

## 8. 性能约束

## 9. 验收标准

## 10. 测试用例清单

## 11. 边界情况

## 12. 文档更新项
```

---

## 9. TDD 任务拆分

### 9.1 F1：读取 `.dcm / DICOM` 文件

#### Spec

`docs/specs/F1-file-ingest.md`

#### 先写测试

`tests/unit/dicom/fileIngest.test.ts`

测试用例：

```text
1. should ingest selected FileList into LocalDicomFile[]
2. should preserve name, size, lastModified
3. should generate stable unique fileId
4. should reject empty file list
5. should not require absolute path
6. should collect skipped non-DICOM files
```

#### 实现模块

`src/dicom/fileIngest.ts`

验收：

```text
- 单文件可导入
- 多文件可导入
- 非 DICOM 不崩溃
- 不读取绝对路径
```

---

### 9.2 F2：读取本地目录

#### Spec

`docs/specs/F2-directory-ingest.md`

#### 先写测试

`tests/unit/dicom/directoryIngest.test.ts`

测试用例：

```text
1. should keep webkitRelativePath when directory is selected
2. should flatten files while preserving hierarchy
3. should ignore unsupported files
4. should sort by relativePath as fallback
```

#### 实现方式

HTML：

```tsx
<input
  type="file"
  multiple
  // React TS 下需要扩展属性或封装组件处理
  webkitdirectory="true"
/>
```

注意：

```text
1. 不实现路径输入。
2. 不实现静默读取。
3. 只使用用户选择后的 FileList。
4. `webkitRelativePath` 用于分组、显示和文件命名。
```

---

### 9.3 F3：Viewer

#### Spec

`docs/specs/F3-viewer.md`

#### 先写测试

单元测试：

```text
tests/unit/viewer/windowLevel.test.ts
tests/unit/viewer/stackNavigation.test.ts
```

集成测试：

```text
tests/integration/import-to-viewer.test.ts
```

E2E：

```text
tests/e2e/import-view-export.spec.ts
```

测试用例：

```text
1. should initialize Cornerstone only once
2. should set active image id
3. should apply window center and width
4. should update zoom state
5. should update pan state
6. should reset viewport state
7. should navigate next and previous instance
```

实现模块：

```text
src/dicom/cornerstoneInit.ts
src/viewer/viewportController.ts
src/viewer/windowLevel.ts
src/viewer/stackNavigation.ts
```

封装原则：

```text
React 组件不直接调用复杂 Cornerstone API。
Cornerstone 初始化、viewport 生命周期、tool 绑定都放在 viewer/ 模块。
```

---

### 9.4 F4：JPEG 批量导出

#### Spec

`docs/specs/F4-jpeg-export.md`

#### 先写测试

单元测试：

```text
tests/unit/export/fileNamer.test.ts
tests/unit/export/jpegEncoder.test.ts
tests/unit/export/exportQueue.test.ts
```

集成测试：

```text
tests/integration/export-pipeline.test.ts
```

E2E：

```text
tests/e2e/import-view-export.spec.ts
```

测试用例：

```text
1. should export current image as JPEG blob
2. should export current series as ZIP
3. should export all imported DICOM images as ZIP
4. should continue when one export job fails
5. should mark unsupported Transfer Syntax as skipped
6. should respect JPEG quality option
7. should produce safe file names
```

实现模块：

```text
src/export/exportController.ts
src/export/canvasRenderer.ts
src/export/jpegEncoder.ts
src/export/zipExporter.ts
src/export/fileNamer.ts
```

---

### 9.5 F5：关键信息烧录

#### Spec

`docs/specs/F5-overlay-burn-in.md`

#### 先写测试

`tests/unit/export/overlayRenderer.test.ts`

测试用例：

```text
1. should render anonymized patient fields by default
2. should not render PatientName when anonymizeOverlay is true
3. should not render PatientID when anonymizeOverlay is true
4. should render modality, series number, instance number
5. should render window center and window width
6. should render non-diagnostic watermark
7. should not overflow overlay box
```

默认烧录字段：

| 区域 | 字段 |
|---|---|
| 左上 | PatientName / PatientID，默认匿名 |
| 左下 | StudyDate / StudyDescription |
| 右上 | Modality / SeriesNumber / InstanceNumber |
| 右下 | WindowCenter / WindowWidth / Rows / Columns |
| 底部 | `Non-diagnostic JPEG · Exported from local DICOM tool` |

默认匿名规则：

| 字段 | 默认显示 |
|---|---|
| PatientName | `Anonymous` |
| PatientID | `Hidden` |
| BirthDate | 不显示 |
| AccessionNumber | 不显示 |
| InstitutionName | 不显示 |
| ReferringPhysicianName | 不显示 |

---

## 10. DICOM Tag 映射规范

所有 tag 映射必须集中在 `src/dicom/metadataMap.ts`。

```ts
export const DICOM_TAGS = {
  PATIENT_NAME: 'x00100010',
  PATIENT_ID: 'x00100020',
  PATIENT_SEX: 'x00100040',
  PATIENT_AGE: 'x00101010',

  STUDY_INSTANCE_UID: 'x0020000d',
  STUDY_DATE: 'x00080020',
  STUDY_TIME: 'x00080030',
  STUDY_DESCRIPTION: 'x00081030',

  SERIES_INSTANCE_UID: 'x0020000e',
  SERIES_NUMBER: 'x00200011',
  SERIES_DESCRIPTION: 'x0008103e',
  MODALITY: 'x00080060',

  SOP_INSTANCE_UID: 'x00080018',
  INSTANCE_NUMBER: 'x00200013',

  ROWS: 'x00280010',
  COLUMNS: 'x00280011',
  WINDOW_CENTER: 'x00281050',
  WINDOW_WIDTH: 'x00281051',
  RESCALE_INTERCEPT: 'x00281052',
  RESCALE_SLOPE: 'x00281053',
  TRANSFER_SYNTAX_UID: 'x00020010'
} as const;
```

规则：

```text
1. UI 不允许出现 DICOM 原始 tag key。
2. 新增 tag 必须同步更新 DICOM_SCOPE.md。
3. 私有 tag 不进入 overlay。
4. 缺失字段返回 undefined，不伪造数据。
```

---

## 11. Transfer Syntax 支持策略

`src/dicom/transferSyntax.ts`

```ts
export const SUPPORTED_TRANSFER_SYNTAXES = new Set<string>([
  '1.2.840.10008.1.2', // Implicit VR Little Endian
  '1.2.840.10008.1.2.1', // Explicit VR Little Endian
  '1.2.840.10008.1.2.1.99', // Deflated Explicit VR Little Endian
  '1.2.840.10008.1.2.4.50', // JPEG Baseline
  '1.2.840.10008.1.2.4.57', // JPEG Lossless
  '1.2.840.10008.1.2.4.70', // JPEG Lossless SV1
  '1.2.840.10008.1.2.4.80', // JPEG-LS Lossless
  '1.2.840.10008.1.2.4.81', // JPEG-LS Lossy
  '1.2.840.10008.1.2.4.90', // JPEG 2000 Lossless
  '1.2.840.10008.1.2.4.91', // JPEG 2000
  '1.2.840.10008.1.2.5' // RLE Lossless
]);

export function isSupportedTransferSyntax(uid?: string): boolean {
  if (!uid) return false;
  return SUPPORTED_TRANSFER_SYNTAXES.has(uid);
}
```

产品提示：

```text
该 DICOM 文件使用当前版本暂不支持的 Transfer Syntax。
文件未损坏，但当前浏览器端解码器无法处理。
请尝试未压缩 DICOM、JPEG Baseline、JPEG-LS、JPEG 2000 或 RLE 格式。
```

---

## 12. package.json 建议

```json
{
  "name": "local-dicom-jpeg-tool",
  "version": "0.1.0",
  "private": true,
  "description": "Local-first browser tool for viewing DICOM files and exporting non-diagnostic JPEG images with burned-in key metadata.",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "quality": "npm run typecheck && npm run lint && npm run test && npm run build"
  },
  "dependencies": {
    "@cornerstonejs/codecs": "latest",
    "@cornerstonejs/core": "latest",
    "@cornerstonejs/dicom-image-loader": "latest",
    "@cornerstonejs/tools": "latest",
    "dicom-parser": "latest",
    "fflate": "latest",
    "zustand": "latest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@testing-library/user-event": "latest",
    "@vitest/ui": "latest",
    "eslint": "latest",
    "jsdom": "latest",
    "playwright": "latest",
    "prettier": "latest",
    "typescript": "latest",
    "vite": "latest",
    "vite-tsconfig-paths": "latest",
    "vitest": "latest"
  }
}
```

实际开发建议：

```text
1. 初始化时可用 latest。
2. 项目跑通后必须锁 package-lock.json。
3. 正式 release 前不要随意升级主依赖。
4. 升级 Cornerstone 相关包必须跑完整 E2E。
```

---

## 13. Vite / Vitest 配置

### 13.1 `vite.config.ts`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  worker: {
    format: 'es'
  },
  build: {
    target: 'es2022',
    sourcemap: true
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  }
});
```

### 13.2 `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setupTests.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html']
    }
  }
});
```

### 13.3 `tests/setupTests.ts`

```ts
import '@testing-library/jest-dom';
```

---

## 14. GitHub Actions CI

`.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  quality:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  e2e:
    runs-on: ubuntu-latest
    needs: quality

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

---

## 15. UI 架构

### 15.1 页面布局

```text
┌──────────────────────────────────────────────┐
│ Header: Local DICOM JPEG Tool                │
├───────────────┬───────────────────┬──────────┤
│ File / Study  │ Viewer             │ Metadata │
│ Tree          │                   │ Export   │
│               │                   │ Jobs     │
├───────────────┴───────────────────┴──────────┤
│ Status: files / active series / export state │
└──────────────────────────────────────────────┘
```

### 15.2 组件职责

| 组件 | 只负责 | 不负责 |
|---|---|---|
| `FileImportPanel` | 触发文件/目录选择 | 解析 DICOM |
| `DicomStudyTree` | 展示 Study/Series/Instance | 分组计算 |
| `DicomViewport` | 承载 viewport DOM | 直接处理导出 |
| `ViewerToolbar` | 派发窗宽窗位/缩放/拖拽事件 | 直接调用复杂渲染 |
| `MetadataPanel` | 展示标准化 metadata | 读取原始 tag |
| `ExportPanel` | 收集导出参数 | 编码 JPEG |
| `JobProgressPanel` | 展示任务状态 | 控制队列底层细节 |

---

## 16. 状态管理

### 16.1 DICOM Store

```ts
interface DicomState {
  files: LocalDicomFile[];
  studies: DicomStudy[];
  activeStudyId?: string;
  activeSeriesId?: string;
  activeInstanceId?: string;
  skippedFiles: Array<{ name: string; reason: string }>;
}
```

### 16.2 Viewer Store

```ts
interface ViewerState {
  windowCenter?: number;
  windowWidth?: number;
  zoom: number;
  pan: { x: number; y: number };
  invert: boolean;
  toolMode: 'windowLevel' | 'pan' | 'zoom' | 'stackScroll';
}
```

### 16.3 Export Store

```ts
interface ExportState {
  jobs: ExportJob[];
  options: ExportOptions;
  running: boolean;
  completedCount: number;
  failedCount: number;
}
```

---

## 17. JPEG 导出规则

### 17.1 导出流程

```text
选择导出范围
  ↓
生成 ExportJob 队列
  ↓
逐张加载 DICOM
  ↓
应用窗宽窗位
  ↓
渲染到 Canvas
  ↓
绘制 overlay
  ↓
canvas.toBlob('image/jpeg', quality)
  ↓
单张下载 / ZIP 批量下载
```

### 17.2 JPEG 质量

| 用途 | quality |
|---|---:|
| 默认 | 0.92 |
| 高质量 | 0.95 |
| 小体积 | 0.85 |

### 17.3 文件命名

格式：

```text
{StudyDate}_{Modality}_S{SeriesNumber}_I{InstanceNumber}_{fileId}.jpg
```

例：

```text
20260612_CT_S3_I42_ab12cd.jpg
```

规则：

```text
1. 文件名只允许 A-Z a-z 0-9 _ - .
2. 缺失字段使用 unknown。
3. 同名冲突自动追加序号。
4. 不使用 PatientName / PatientID 作为文件名。
```

---

## 18. 性能策略

| 场景 | 策略 |
|---|---|
| 大目录导入 | 先解析 metadata，不立即全部解码 |
| Viewer 浏览 | 当前实例 ± 2 张预加载 |
| 批量导出 | 默认并发 2，最大并发 4 |
| 单文件过大 | 超过 500MB 提示性能风险 |
| ZIP 过大 | 超过 1GB 提示分批导出 |
| Canvas 释放 | 每个 job 完成后释放 canvas 引用 |
| 错误文件 | 标记 failed/skipped，不阻断队列 |

---

## 19. 隐私与安全规则

### 19.1 默认匿名

默认：

```ts
const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  scope: 'current',
  jpegQuality: 0.92,
  includeOverlay: true,
  anonymizeOverlay: true,
  overlayPosition: 'right',
  useCurrentWindowLevel: true
};
```

### 19.2 不烧录字段

```text
PatientName 原文
PatientID 原文
PatientBirthDate
AccessionNumber
InstitutionName
ReferringPhysicianName
OperatorName
DeviceSerialNumber
Private Tags
```

### 19.3 非诊断声明

UI 和 JPEG 底部必须出现：

```text
Non-diagnostic JPEG · Exported from local DICOM tool
```

---

## 20. 测试计划

### 20.1 单元测试覆盖

| 模块 | 必测项 |
|---|---|
| `fileIngest` | 文件列表转换、相对路径、空列表、跳过文件 |
| `metadataParser` | tag 读取、缺失字段、异常文件、Transfer Syntax |
| `seriesGrouper` | Study/Series/Instance 分组与排序 |
| `windowLevel` | 窗宽窗位参数处理 |
| `fileNamer` | 安全文件名、冲突处理 |
| `overlayRenderer` | 匿名字段、关键字段、边界溢出 |
| `jpegEncoder` | quality、失败处理 |
| `zipExporter` | 多文件打包、失败列表 |

### 20.2 集成测试覆盖

| 场景 | 预期 |
|---|---|
| 导入 → 解析 → 分组 | 树结构正确 |
| 导入 → Viewer | 图像能显示 |
| Viewer → Export | 当前窗宽窗位被使用 |
| Metadata → Overlay | overlay 字段一致 |
| Export Queue | 单个失败不阻断整体 |
| Anonymous Export | JPEG overlay 不出现敏感原文 |

### 20.3 E2E 测试覆盖

| 用例 | 步骤 |
|---|---|
| 单文件查看 | 上传 fixture DICOM → 显示 Viewer |
| 多文件序列 | 上传多张 DICOM → 切片滚动 |
| 目录读取 | 上传目录 → 显示 StudyTree |
| 单张导出 | 点击导出当前图像 → 生成 JPEG |
| 批量导出 | 选择 Series → 导出 ZIP |
| 匿名导出 | 开启默认匿名 → 不出现 PatientName 原文 |

---

## 21. Fixture 管理

`tests/fixtures/README.md`：

```md
# DICOM Fixtures

## 规则

1. 不提交真实患者数据。
2. 只允许使用公开、去标识化测试 DICOM。
3. 每个 fixture 需要记录来源、许可证、Modality、Transfer Syntax。
4. 不允许把敏感医疗数据放入仓库。
5. 若 fixture 文件较大，使用 Git LFS 或在 README 中注明下载方式。
```

建议 fixture 类型：

```text
- CT, Explicit VR Little Endian
- MR, Explicit VR Little Endian
- DX/CR, 单张图
- US multi-frame
- JPEG Baseline compressed
- JPEG 2000 compressed
- RLE compressed
- 非 DICOM 文件
- 缺失 InstanceNumber 的 DICOM
```

---

## 22. 开发文档清单

| 文件 | 必须内容 |
|---|---|
| `README.md` | 项目简介、安装、运行、构建、免责声明 |
| `docs/README_PRODUCT.md` | 产品范围、非目标、用户流程 |
| `docs/ARCHITECTURE.md` | 模块边界、数据流、状态流 |
| `docs/DICOM_SCOPE.md` | 支持/不支持的 DICOM 类型、Transfer Syntax |
| `docs/EXPORT_SPEC.md` | JPEG 输出、overlay 字段、命名规则 |
| `docs/CODE_STYLE.md` | TS、React、错误处理、测试规范 |
| `docs/TEST_PLAN.md` | TDD 策略、单元/集成/E2E 测试 |
| `docs/SECURITY_PRIVACY.md` | 本地处理、匿名规则、敏感字段 |
| `docs/ERROR_HANDLING.md` | 错误码、用户提示、日志格式 |
| `docs/RELEASE_CHECKLIST.md` | 发版前检查项 |
| `docs/adr/*.md` | 架构决策记录 |

---

## 23. ADR 架构决策记录

### 23.1 `docs/adr/0001-use-cornerstone3d.md`

```md
# ADR 0001: Use Cornerstone3D as the DICOM rendering engine

## Status

Accepted

## Context

The project needs browser-based DICOM rendering, window/level, zoom, pan, stack navigation, and compressed DICOM decoding.

## Decision

Use Cornerstone3D with @cornerstonejs/dicom-image-loader and @cornerstonejs/codecs.

## Consequences

- Pros: mature medical imaging ecosystem, WebGL rendering, WASM codecs, MIT license.
- Cons: learning curve and version compatibility risk.
```

### 23.2 `docs/adr/0002-use-sdd-tdd.md`

```md
# ADR 0002: Use SDD + TDD development workflow

## Status

Accepted

## Decision

Feature-level development starts with specs. Module-level implementation starts with failing tests.

## Consequences

- Better requirement traceability.
- Higher initial development cost.
- Lower regression risk.
```

### 23.3 `docs/adr/0003-use-canvas-jpeg-export.md`

```md
# ADR 0003: Use Canvas to export JPEG

## Status

Accepted

## Decision

Render DICOM to Canvas, draw overlay, then export using canvas.toBlob('image/jpeg').

## Consequences

- Simple and browser-native.
- JPEG is lossy and non-diagnostic.
- Export result is a rendered view, not raw DICOM pixel data.
```

### 23.4 `docs/adr/0004-directory-access-boundary.md`

```md
# ADR 0004: Directory access requires user selection

## Status

Accepted

## Decision

Directory reading uses input[type=file][webkitdirectory][multiple]. No absolute path input. No silent filesystem scanning.

## Consequences

- Browser-compliant.
- User must manually select folder.
- Relative paths are preserved via File.webkitRelativePath.
```

---

## 24. 开发顺序

```text
Step 0：初始化项目与质量门禁
Step 1：写 docs/specs/F1-file-ingest.md
Step 2：TDD 实现文件导入
Step 3：写 docs/specs/F2-directory-ingest.md
Step 4：TDD 实现目录导入
Step 5：写 docs/specs/F3-viewer.md
Step 6：TDD + 集成测试实现 Viewer
Step 7：写 docs/specs/F4-jpeg-export.md
Step 8：TDD 实现 JPEG 导出队列
Step 9：写 docs/specs/F5-overlay-burn-in.md
Step 10：TDD 实现 overlay 烧录与匿名规则
Step 11：补齐 E2E 测试
Step 12：补齐 docs 与 ADR
Step 13：执行 release checklist
```

---

## 25. 本地执行命令

### 25.1 开发

```bash
npm run dev
```

打开：

```text
http://127.0.0.1:5173
```

### 25.2 质量检查

```bash
npm run quality
```

等价于：

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

### 25.3 E2E

```bash
npm run test:e2e
```

### 25.4 构建

```bash
npm run build
```

### 25.5 本地预览构建产物

```bash
npm run preview
```

---

## 26. Release Checklist

发版前必须完成：

```text
[ ] npm run typecheck 通过
[ ] npm run lint 通过
[ ] npm run test 通过
[ ] npm run test:e2e 通过
[ ] npm run build 通过
[ ] README.md 已更新
[ ] DICOM_SCOPE.md 已更新
[ ] EXPORT_SPEC.md 已更新
[ ] SECURITY_PRIVACY.md 已更新
[ ] RELEASE_CHECKLIST.md 已勾选
[ ] 默认匿名模式已验证
[ ] JPEG 底部 Non-diagnostic 声明已验证
[ ] 不支持 Transfer Syntax 的提示已验证
[ ] 大目录导出失败不会阻断整体任务
[ ] package-lock.json 已提交
```

---

## 27. 风险清单

| 风险 | 等级 | 规避 |
|---|---:|---|
| 不同浏览器目录读取兼容差异 | 中 | 主推荐 Chrome/Edge；保留多文件上传 fallback |
| 某些 DICOM 无法解码 | 高 | 读取 Transfer Syntax UID，提前提示并跳过 |
| JPEG 有损导致误用 | 高 | 强制 Non-diagnostic 水印 |
| 隐私信息泄露 | 高 | 默认匿名；不烧录敏感字段；不使用 Patient 信息命名 |
| 像素中已有患者信息 | 高 | V1 提示风险，不承诺自动清理 |
| 批量导出内存过高 | 中 | 限制并发、释放 canvas、分批导出 |
| Cornerstone 版本变化 | 中 | 锁 package-lock；升级必须跑 E2E |
| GPL 依赖污染 | 中 | 不引入 DWV 源码作为主依赖 |
| 真实患者测试数据入库 | 高 | Fixture 管理规则 + 禁止真实数据 |

---

## 28. 给本地 Coding Agent 的执行 Prompt

可直接复制给本地 Agent：

```text
你是本项目的 TypeScript 医学影像前端开发 Agent。请严格按照 DEVELOPMENT_PLAN.md 执行开发。

目标：
开发 local-dicom-jpeg-tool，一个本地优先的 DICOM 查看与 JPEG 批量转换工具。

开发方式：
采用 SDD + TDD 混合模式：
1. 每个功能先写 docs/specs/Fx-xxx.md。
2. 再写失败测试。
3. 再实现最小代码。
4. 再补集成测试和 E2E。
5. 测试成功后更新相关 docs 和 ADR。
6. 不要擅自扩大功能范围。
7. 不要实现网络上传、DICOM 写回、诊断级测量、PACS 接入。
8. 不要引入 GPL 主依赖。
9. 不要在 UI 组件里直接解析 DICOM tag。
10. 不要在没有测试的情况下实现核心模块。

每完成一个阶段，执行：
npm run typecheck
npm run lint
npm run test
npm run build

若失败，先修复失败原因，再继续下一阶段。
```

---

## 29. 官方与开源参考源

> 用于人工复核，不要求代码直接引用全部项目。

1. Cornerstone3D GitHub  
   https://github.com/cornerstonejs/cornerstone3D

2. Cornerstone.js 官方文档  
   https://www.cornerstonejs.org/

3. Cornerstone local DICOM P10 example  
   https://github.com/cornerstonejs/cornerstoneWADOImageLoader/blob/master/examples/dicomfile/index.html

4. OHIF Viewer GitHub  
   https://github.com/OHIF/Viewers

5. DICOM Standard  
   https://www.dicomstandard.org/

6. DICOM Part 15 Attribute Confidentiality Profiles  
   https://dicom.nema.org/medical/dicom/current/output/chtml/part15/chapter_e.html

7. MDN `HTMLInputElement.webkitdirectory`  
   https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/webkitdirectory

8. MDN `HTMLCanvasElement.toBlob()`  
   https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob

9. Vite  
   https://vite.dev/

10. Vitest  
   https://vitest.dev/

11. Playwright CI  
   https://playwright.dev/docs/ci

12. TypeScript TSConfig  
   https://www.typescriptlang.org/tsconfig/

---

## 30. 最终结论

本方案可以直接作为本地仓库的 `DEVELOPMENT_PLAN.md` 执行。

推荐开发顺序：

```text
先跑通：文件导入 → metadata → 单图显示 → 单图 JPEG 导出
再扩展：目录读取 → Study/Series 分组 → 批量导出 → overlay 匿名
最后补齐：E2E → 文档 → Release checklist
```

最低可发布版本定义：

```text
1. 可以导入本地 DICOM 文件/目录。
2. 可以查看图像并调窗宽窗位、缩放、拖拽。
3. 可以将当前图像和当前序列导出为 JPEG。
4. JPEG 默认匿名并带 Non-diagnostic 声明。
5. 失败文件不会导致整体崩溃。
6. npm run quality 全部通过。
```
