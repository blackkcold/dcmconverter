# Test Plan

## 单元测试

- `fileIngest`：文件过滤、相对路径、稳定 ID、空选择。
- `seriesGrouper`：Study / Series / Instance 分组排序。
- `windowLevel`：默认值、窗宽下限、增量调整。
- `stackNavigation`：边界 clamp。
- `fileNamer`：安全命名和冲突处理。
- `overlayRenderer`：匿名字段、水印和关键字段。
- `jpegEncoder`：JPEG MIME 与失败处理。
- `zipExporter`：多文件打包。
- `exportJobBuilder`：稳定排序、批次切分、个人信息文件名。
- `exportManifest`：断点跳过和参数变化重导出。
- `batchExportRunner`：严格串行、失败不中断、只重试失败项。

## 集成测试

- ingest -> metadata map -> grouping。
- metadata -> overlay。
- canvas -> jpeg -> zip。
- batch export -> manifest -> report。

## E2E

- 首页可打开。
- 未导入时 viewer 显示空状态。
- 导入控件可见。
- 批量导出控件可见。
