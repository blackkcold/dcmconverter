# F4 功能规格：JPEG 导出

## 目标

把当前 viewer canvas 导出为 JPEG；批量结果可打包 ZIP。

## 输入

`HTMLCanvasElement`、`DicomMetadata`、`ExportOptions`。

## 输出

`JpegExportResult` 或 ZIP `Blob`。

## 验收标准

- JPEG 使用 `canvas.toBlob('image/jpeg')`。
- 文件名不包含 PatientName / PatientID。
- ZIP 打包失败时返回 `ZIP_EXPORT_FAILED`。
- 单个导出失败可被任务状态记录。
