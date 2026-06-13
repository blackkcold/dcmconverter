# F2 功能规格：读取本地目录 / F2 Functional Spec: Read Local Folders

## 目标 / Goal

通过浏览器目录选择器读取用户授权目录内的文件。<br>
Read files from a user-authorized folder via the browser directory picker.

## 输入 / Input

带 `webkitRelativePath` 的 `FileList`。<br>
A `FileList` with `webkitRelativePath`.

## 输出 / Output

扁平化 `LocalDicomFile[]`，保留目录相对路径。<br>
Flattened `LocalDicomFile[]` while preserving directory-relative paths.

## 约束 / Constraints

不实现路径输入，不实现静默读取，只使用用户选择后的 `FileList`。<br>
No path input, no silent reads, and only the `FileList` selected by the user is used.

## 验收标准 / Acceptance Criteria

- 保留 `webkitRelativePath`。<br>`webkitRelativePath` is preserved.
- 非 DICOM 候选文件被跳过。<br>Non-DICOM candidate files are skipped.
- 缺少 `webkitRelativePath` 时回退到文件名。<br>When `webkitRelativePath` is missing, the file name is used as a fallback.
