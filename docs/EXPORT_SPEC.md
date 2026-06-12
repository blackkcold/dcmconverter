# Export Spec

## 输出

- JPEG MIME：`image/jpeg`
- 默认质量：`0.92`
- 首选输出：用户选择的目标文件夹
- 备用输出：ZIP
- 文件名格式：`{StudyDate}_{PatientID}_{Modality}_S{SeriesNumber}_I{InstanceNumber}_{fileId}.jpg`

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
