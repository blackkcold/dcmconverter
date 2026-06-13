# F1 功能规格：读取 DICOM 文件 / F1 Functional Spec: Read DICOM Files

## 目标 / Goal

把用户主动选择的本地文件转换为 `LocalDicomFile[]`。<br>
Convert user-selected local files into `LocalDicomFile[]`.

## 非目标 / Non-goals

不静默读取绝对路径，不上传文件，不在 ingest 阶段解码像素。<br>
Do not silently read absolute paths, upload files, or decode pixels during ingest.

## 输入 / Input

`FileList` 或 `File[]`。<br>
`FileList` or `File[]`.

## 输出 / Output

`FileIngestResult`：包含可处理候选文件和跳过文件列表。<br>
`FileIngestResult`: includes processable candidate files and a skipped-file list.

## 验收标准 / Acceptance Criteria

- 多文件可导入。<br>Multiple files can be imported.
- 保留 `name`、`size`、`lastModified`、`relativePath`。<br>`name`, `size`, `lastModified`, and `relativePath` are preserved.
- 明显非 DICOM 文件被跳过。<br>Obvious non-DICOM files are skipped.
- 空选择返回 skipped 记录而不抛错。<br>An empty selection returns skipped records without throwing.
