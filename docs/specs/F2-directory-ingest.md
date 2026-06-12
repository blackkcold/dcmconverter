# F2 功能规格：读取本地目录

## 目标

通过浏览器目录选择器读取用户授权目录内的文件。

## 输入

带 `webkitRelativePath` 的 `FileList`。

## 输出

扁平化 `LocalDicomFile[]`，保留目录相对路径。

## 约束

不实现路径输入，不实现静默读取，只使用用户选择后的 `FileList`。

## 验收标准

- 保留 `webkitRelativePath`。
- 非 DICOM 候选文件被跳过。
- 缺少 `webkitRelativePath` 时回退到文件名。
