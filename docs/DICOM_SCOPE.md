# DICOM Scope

## V1 支持

- 标准 DICOM P10 文件。
- `.dcm`、`.dicom`、`.ima` 后缀，和无后缀候选文件。
- 本地文件选择和目录选择。
- 常见 Transfer Syntax 的产品层提示与检查。

## V1 不承诺

- 所有厂商私有 Transfer Syntax。
- DICOMDIR 完整导航。
- 多帧高级播放控制。
- 诊断显示校准。
- 像素内 PHI 自动清除。

## Tag 映射

所有 tag key 集中在 `src/dicom/metadataMap.ts`，UI 只消费 `DicomMetadata`。

当前会解析并用于导出归类或 JPEG Meta 的核心字段包括：

- PatientName / PatientID / PatientSex / PatientAge
- StudyDate / StudyTime / StudyDescription / StudyInstanceUID
- SeriesInstanceUID / SeriesNumber / SeriesDescription / ProtocolName
- Modality / ImageType / SOPInstanceUID / InstanceNumber
- Rows / Columns / WindowCenter / WindowWidth
- SliceThickness / SpacingBetweenSlices / PixelSpacing
- RescaleIntercept / RescaleSlope / RescaleType
- Manufacturer / ManufacturerModelName / TransferSyntaxUID
