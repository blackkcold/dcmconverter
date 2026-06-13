# Product Scope / 产品范围

## 目标 / Goal
Local DICOM JPEG Tool 提供一个本地浏览器工具，让用户主动选择 DICOM 文件或目录，查看基础影像与 metadata，并导出带匿名关键信息的非诊断 JPEG。

Local DICOM JPEG Tool provides a browser-based local tool that lets users explicitly select DICOM files or folders, review basic images and metadata, and export non-diagnostic JPEGs with anonymized key information.

## 非目标 / Non-goals
- 不做诊断级医学 Viewer。
- 不写回或修改原始 DICOM。
- 不接入 PACS / DICOMweb。
- 不静默扫描本地路径。
- 不承诺自动清除像素内患者信息。

- No diagnostic-grade medical viewer.
- No writing back to or modifying the source DICOM.
- No PACS / DICOMweb integration.
- No silent scanning of local paths.
- No promise to automatically remove burned-in pixel PHI.

## 用户流程 / User Flow
1. 用户选择 DICOM 文件或目录。
2. 工具收集候选 DICOM 文件并跳过明显非 DICOM 文件。
3. 解析 metadata 并按 Study / Series / Instance 分组。
4. 用户选择实例并在 viewer 中查看。
5. 用户在导出面板里设置导出包名称和文件名模板，再导出 JPEG。

1. The user selects DICOM files or a folder.
2. The tool collects candidate DICOM files and skips obvious non-DICOM files.
3. Metadata is parsed and grouped by Study / Series / Instance.
4. The user selects an instance and views it in the viewer.
5. The user sets the export package name and filename template in the export panel, then exports JPEGs.

## 导出命名 / Export Naming
导出包名称会同时驱动 folder export 根目录和 ZIP 下载名；JPEG 文件名模板只提供主字段组合，不支持自由文本拼接。<br>
The export package name drives both the folder-export root directory and the ZIP download name; JPEG filename templates only provide main-field combinations and do not support free-text composition.
