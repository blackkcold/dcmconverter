# Export Spec

## 输出

- JPEG MIME：`image/jpeg`
- 默认质量：`0.92`
- 首选输出：用户选择的目标文件夹
- 备用输出：ZIP
- 默认目录结构：`Study_{StudyDate}_{StudyUID短码}/S{SeriesNumber}_{Modality}_{SeriesUID短码}/`
- 可选目录结构：平铺、按 Study/Series、保留来源子目录、按 Series + 来源子目录
- 文件名格式：`{序号}_{StudyDate}_{PatientID}_{Modality}_S{SeriesNumber}_I{InstanceNumber}_{fileId}.jpg`
- 序号按输出目录分别递增，保证文件管理器按名称排序时符合 DICOM 顺序。

## 批量导出

- 严格串行，固定并发 1。
- 默认每批 25 张。
- 每张 JPEG 成功后立即写入目标文件夹。
- `.dcm-jpeg-export-manifest.json` 记录断点继续状态。
- 结束后写入 `export-report.json` 和 `export-report.csv`。

## Overlay

完整个人信息模式默认显示：

- PatientName
- PatientID
- PatientSex / PatientAge
- StudyDate / StudyDescription
- Modality / SeriesNumber / InstanceNumber
- WindowCenter / WindowWidth / Rows / Columns
- `Non-diagnostic JPEG · Exported from local DICOM tool`

## 隐私

关闭“包含个人信息”后，PatientName 显示为 `Anonymous`，PatientID 显示为 `Hidden`，文件名不包含 PatientID。
