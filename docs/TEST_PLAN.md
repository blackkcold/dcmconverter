# Test Plan / 测试计划

## 单元测试 / Unit Tests

- `fileIngest`：文件过滤、相对路径、稳定 ID、空选择。<br>`fileIngest`: file filtering, relative paths, stable IDs, and empty selections.
- `seriesGrouper`：Study / Series / Instance 分组排序。<br>`seriesGrouper`: Study / Series / Instance grouping and sorting.
- `windowLevel`：默认值、窗宽下限、增量调整。<br>`windowLevel`: defaults, minimum window width, and incremental adjustments.
- `stackNavigation`：边界 clamp。<br>`stackNavigation`: boundary clamping.
- `exportNaming`：字段清洗、缺失值回退、数字补零、模板渲染、重名处理。<br>`exportNaming`: field sanitization, missing-value fallback, zero padding, template rendering, and duplicate handling.
- `fileNamer`：序号前缀和冲突兜底。<br>`fileNamer`: sequence prefixing and collision fallback.
- `overlayRenderer`：匿名字段、水印和关键字段。<br>`overlayRenderer`: anonymized fields, watermarks, and key fields.
- `jpegEncoder`：JPEG MIME 与失败处理。<br>`jpegEncoder`: JPEG MIME handling and failure cases.
- `jpegMetadata`：EXIF 字段拆分（ImageDescription-only / UserComment-only / 全量 / 空 payload 报错）、`OverlayBurnedIn` 命名验证。<br>`jpegMetadata`: EXIF field splitting (ImageDescription-only / UserComment-only / full / empty payload error), `OverlayBurnedIn` naming verification.
- `zipExporter`：多文件打包。<br>`zipExporter`: multi-file packaging.
- `exportJobBuilder`：稳定排序、批次切分、导出包前缀、`outputRelativePath`、`optionsHash`。<br>`exportJobBuilder`: stable sorting, batch splitting, export package prefixes, `outputRelativePath`, and `optionsHash`.
- `exportManifest`：断点跳过和参数变化重导出。<br>`exportManifest`: resume skipping and re-export on parameter changes.
- `batchExportRunner`：严格串行、失败不中断、只重试失败项。<br>`batchExportRunner`: strict serialization, non-blocking failures, and retrying only failed items.

## 集成测试 / Integration Tests

- ingest -> metadata map -> grouping。<br>ingest -> metadata map -> grouping.
- metadata -> overlay。<br>metadata -> overlay.
- canvas -> jpeg -> zip。<br>canvas -> jpeg -> zip.
- folder export -> export package root -> manifest/report placement。<br>folder export -> export package root -> manifest/report placement.
- ZIP export -> export package root prefix -> ZIP internal path prefix / download filename。<br>ZIP export -> export package root prefix -> ZIP internal path prefix / download filename.

## E2E / E2E

- 首页可打开。<br>The home page opens successfully.
- 未导入时 viewer 显示空状态。<br>The viewer shows an empty state when nothing is imported.
- 导入控件可见。<br>The import controls are visible.
- 批量导出控件可见。<br>The batch export controls are visible.
- 在导出面板里修改包名和模板后，导出结果按新命名落盘。<br>After changing the package name and template in the export panel, exported results land with the new naming.
