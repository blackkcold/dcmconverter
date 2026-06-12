# F1 功能规格：读取 DICOM 文件

## 目标

把用户主动选择的本地文件转换为 `LocalDicomFile[]`。

## 非目标

不静默读取绝对路径，不上传文件，不在 ingest 阶段解码像素。

## 输入

`FileList` 或 `File[]`。

## 输出

`FileIngestResult`：包含可处理候选文件和跳过文件列表。

## 验收标准

- 多文件可导入。
- 保留 `name`、`size`、`lastModified`、`relativePath`。
- 明显非 DICOM 文件被跳过。
- 空选择返回 skipped 记录而不抛错。
