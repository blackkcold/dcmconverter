# F3 功能规格：Viewer

## 目标

初始化 Cornerstone3D viewport，显示当前 DICOM 实例，并提供窗宽窗位、缩放、重置等基础控制。

## 非目标

不提供诊断级标尺、校准、审计或完整 PACS 工具。

## 验收标准

- Cornerstone 初始化只复用一个初始化 promise。
- 当前实例切换时销毁旧 viewport。
- 窗宽窗位参数有默认值和宽度下限。
- 未能渲染时显示用户可读错误。
