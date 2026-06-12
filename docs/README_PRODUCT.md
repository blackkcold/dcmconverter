# Product Scope

## 目标

Local DICOM JPEG Tool 提供一个本地浏览器工具，让用户主动选择 DICOM 文件或目录，查看基础影像与 metadata，并导出带匿名关键信息的非诊断 JPEG。

## 非目标

- 不做诊断级医学 Viewer。
- 不写回或修改原始 DICOM。
- 不接入 PACS / DICOMweb。
- 不静默扫描本地路径。
- 不承诺自动清除像素内患者信息。

## 用户流程

1. 用户选择 DICOM 文件或目录。
2. 工具收集候选 DICOM 文件并跳过明显非 DICOM 文件。
3. 解析 metadata 并按 Study / Series / Instance 分组。
4. 用户选择实例并在 viewer 中查看。
5. 用户导出 JPEG，默认匿名 overlay。
