# Export Spec / 导出规格

## 输出 / Output

- JPEG MIME：`image/jpeg`。<br>JPEG MIME: `image/jpeg`.
- 默认质量：`0.92`。<br>Default quality: `0.92`.
- 可选超高清质量：`1.0`。<br>Optional ultra-high quality: `1.0`.
- 首选输出：用户选择的目标文件夹。<br>Preferred output: the user-selected destination folder.
- 备用输出：ZIP。<br>Fallback output: ZIP.
- 默认目录结构：`Study_{StudyDate}_{StudyUID短码}/Protocol_{ProtocolName}/S{SeriesNumber}_{SeriesDescription}_{SeriesUID短码}/`。<br>Default directory structure: `Study_{StudyDate}_{StudyUID短码}/Protocol_{ProtocolName}/S{SeriesNumber}_{SeriesDescription}_{SeriesUID短码}/`.
- 可选目录结构：平铺、按 Study/Series、保留来源子目录、按 Series + 来源子目录、按指定 Meta 字段。<br>Optional directory layouts: flat, Study/Series, preserve source subdirectories, Series + source subdirectories, or by a chosen Meta field.
- 指定 Meta 字段支持：`Series Description`、`Protocol Name`、`Instance`。<br>Supported Meta fields: `Series Description`, `Protocol Name`, and `Instance`.
- 导出包名称可配置，并同时用于 folder export 的根子文件夹名和 ZIP 下载文件名。<br>The export package name is configurable and is used for both the folder-export root directory and the ZIP download filename.
- JPEG 文件名使用受控模板生成，支持预设模板和字段组合模板。可选字段仅包含主要 Meta 字段：`StudyDate`、`StudyDescription`、`Modality`、`ProtocolName`、`SeriesNumber`、`SeriesDescription`、`InstanceNumber`。<br>JPEG filenames are generated from controlled templates, supporting preset templates and field-combination templates. Available fields are limited to the main Meta fields: `StudyDate`, `StudyDescription`, `Modality`, `ProtocolName`, `SeriesNumber`, `SeriesDescription`, and `InstanceNumber`.
- 序号按输出目录分别递增，保证文件管理器按名称排序时符合 DICOM 顺序。<br>The sequence number increments independently per output directory so file managers sort in DICOM order by name.
- 文件名模板仍保留序号前缀和重名兜底后缀，由系统自动补齐。<br>The filename template still gets a sequence prefix and duplicate-name suffix automatically from the system.
- 可在导出阶段覆盖 PatientName / PatientSex / PatientAge；不修改源 DICOM 文件。<br>PatientName / PatientSex / PatientAge can be overridden during export; the source DICOM file is not modified.
- 默认写入 JPEG EXIF `ImageDescription` 和 `UserComment`，保存内部查看所需的非 PHI DICOM 摘要。<br>By default, JPEG EXIF `ImageDescription` and `UserComment` are written to preserve the non-PHI DICOM summary needed for internal review.

## 批量导出 / Batch Export

- 严格串行，固定并发 1。<br>Strictly serial with concurrency fixed at 1.
- 默认每批 25 张。<br>Default batch size is 25 images.
- 每张 JPEG 成功后立即写入 `/<导出包名>/...` 下的目标文件夹。<br>Each JPEG is written immediately into the target folder under `/<export package name>/...`.
- `.dcm-jpeg-export-manifest.json`、`export-report.json` 和 `export-report.csv` 都写入导出包根目录。<br>`.dcm-jpeg-export-manifest.json`, `export-report.json`, and `export-report.csv` are all written into the export-package root directory.

## Overlay / 叠加信息

完整个人信息模式默认显示：<br>
The full personal-information mode shows the following by default:

- PatientName
- PatientID
- PatientSex / PatientAge
- StudyDate / StudyDescription
- Modality / SeriesNumber / InstanceNumber
- WindowCenter / WindowWidth / Rows / Columns
- `Non-diagnostic JPEG · Exported from local DICOM tool`

## 隐私 / Privacy

关闭“包含个人信息”后，PatientName 显示为 `Anonymous`，PatientID 显示为 `Hidden`，文件名不包含 PatientID。<br>
When "Include personal information" is off, PatientName is shown as `Anonymous`, PatientID is shown as `Hidden`, and filenames do not include PatientID.
