# DICOM Scope / DICOM 范围

## V1 支持 / V1 Supported

- 标准 DICOM P10 文件。<br>Standard DICOM P10 files.
- `.dcm`、`.dicom`、`.ima` 后缀，和无后缀候选文件。<br>`.dcm`, `.dicom`, `.ima`, and extensionless candidate files.
- 本地文件选择和目录选择。<br>Local file selection and directory selection.
- 常见 Transfer Syntax 的产品层提示与检查。<br>Product-level hints and checks for common Transfer Syntaxes.

## V1 不承诺 / V1 Non-goals

- 所有厂商私有 Transfer Syntax。<br>All vendor-specific Transfer Syntaxes.
- DICOMDIR 完整导航。<br>Full DICOMDIR navigation.
- 多帧高级播放控制。<br>Advanced multi-frame playback controls.
- 诊断显示校准。<br>Diagnostic display calibration.
- 像素内 PHI 自动清除。<br>Automatic removal of burned-in pixel PHI.

## Tag 映射 / Tag Mapping

所有 tag key 集中在 `src/dicom/metadataMap.ts`，UI 只消费 `DicomMetadata`。<br>
All tag keys are centralized in `src/dicom/metadataMap.ts`, and the UI only consumes `DicomMetadata`.

当前会解析并用于导出归类或 JPEG Meta 的核心字段包括：<br>
The core fields parsed for export grouping or JPEG metadata are:

- PatientName / PatientID / PatientSex / PatientAge
- StudyDate / StudyTime / StudyDescription / StudyInstanceUID
- SeriesInstanceUID / SeriesNumber / SeriesDescription / ProtocolName
- Modality / ImageType / SOPInstanceUID / InstanceNumber
- Rows / Columns / WindowCenter / WindowWidth
- SliceThickness / SpacingBetweenSlices / PixelSpacing
- RescaleIntercept / RescaleSlope / RescaleType
- Manufacturer / ManufacturerModelName / TransferSyntaxUID

导出命名只开放主字段白名单：`StudyDate`、`StudyDescription`、`Modality`、`ProtocolName`、`SeriesNumber`、`SeriesDescription`、`InstanceNumber`。<br>
Export naming only exposes the main-field whitelist: `StudyDate`, `StudyDescription`, `Modality`, `ProtocolName`, `SeriesNumber`, `SeriesDescription`, and `InstanceNumber`.

命名规则集中在 `src/export/exportNaming.ts`，负责字段清洗、缺失值回退和模板渲染。<br>
The naming rules are centralized in `src/export/exportNaming.ts`, which handles field sanitization, missing-value fallback, and template rendering.
