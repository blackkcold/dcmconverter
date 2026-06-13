# Code Style / 代码风格

- TypeScript strict mode。<br>TypeScript strict mode.
- 禁止 `any`，需要收窄时使用 `unknown`。<br>Avoid `any`; use `unknown` when narrowing is needed.
- 业务逻辑放入 `dicom/`、`viewer/`、`export/`。<br>Keep business logic in `dicom/`, `viewer/`, and `export/`.
- UI 组件只负责交互和展示。<br>UI components should only handle interaction and presentation.
- 命名规则、字段白名单、非法字符清洗和模板渲染集中在共享命名模块，UI 不直接拼接文件名字符串。<br>Keep naming rules, field whitelists, invalid-character sanitization, and template rendering in the shared naming module; UI components should not assemble filename strings directly.
- 核心模块优先写单元测试。<br>Prefer unit tests for core modules first.
- 异常统一转为 `AppError` 或在 UI 层展示用户可读信息。<br>Normalize errors into `AppError` or surface user-readable messages at the UI layer.
