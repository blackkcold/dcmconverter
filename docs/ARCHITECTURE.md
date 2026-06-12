# Architecture

## 模块边界

| 模块 | 职责 |
|---|---|
| `src/dicom` | 文件导入、metadata 解析、Transfer Syntax 判断、Study 分组、Cornerstone 文件注册 |
| `src/viewer` | Cornerstone 初始化、viewport 生命周期、窗宽窗位和 stack navigation |
| `src/export` | Canvas 克隆、overlay 烧录、JPEG 编码、ZIP 打包、文件命名 |
| `src/store` | DICOM、viewer、export 三类状态 |
| `src/components` | UI 展示和用户事件派发 |

## 数据流

```text
File input / directory input
  -> ingestFiles()
  -> parseDicomMetadata()
  -> groupDicomFiles()
  -> DicomStudyTree / MetadataPanel / DicomViewport
  -> exportCanvasAsJpeg()
```

## 约束

- React 组件不直接解析 DICOM tag。
- Cornerstone API 集中在 `dicom/cornerstoneInit.ts` 和 `viewer/viewportController.ts`。
- 导出默认匿名，敏感字段不进入文件名。
