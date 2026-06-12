# Code Style

- TypeScript strict mode。
- 禁止 `any`，需要收窄时使用 `unknown`。
- 业务逻辑放入 `dicom/`、`viewer/`、`export/`。
- UI 组件只负责交互和展示。
- 核心模块优先写单元测试。
- 异常统一转为 `AppError` 或在 UI 层展示用户可读信息。
