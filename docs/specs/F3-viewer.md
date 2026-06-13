# F3 功能规格：Viewer / F3 Functional Spec: Viewer

## 目标 / Goal

初始化 Cornerstone3D viewport，显示当前 DICOM 实例，并提供窗宽窗位、缩放、重置等基础控制。<br>
Initialize a Cornerstone3D viewport, display the current DICOM instance, and provide basic controls such as window/level, zoom, and reset.

## 非目标 / Non-goals

不提供诊断级标尺、校准、审计或完整 PACS 工具。<br>
Do not provide diagnostic-grade rulers, calibration, auditing, or full PACS tooling.

## 验收标准 / Acceptance Criteria

- Cornerstone 初始化只复用一个初始化 promise。<br>Cornerstone initialization reuses a single initialization promise.
- 当前实例切换时销毁旧 viewport。<br>The previous viewport is destroyed when the current instance changes.
- 窗宽窗位参数有默认值和宽度下限。<br>Window/level parameters have defaults and a minimum width.
- 未能渲染时显示用户可读错误。<br>User-readable errors are shown when rendering fails.
