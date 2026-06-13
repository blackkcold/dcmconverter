# Error Handling / 错误处理

## 错误码 / Error Codes

| Code | 含义 / Meaning |
|---|---|
| `FILE_NOT_DICOM` | 文件不属于 DICOM 候选。<br>The file is not a DICOM candidate. |
| `FILE_READ_FAILED` | 浏览器读取文件失败。<br>The browser failed to read the file. |
| `DICOM_PARSE_FAILED` | metadata 解析失败。<br>Metadata parsing failed. |
| `DICOM_UNSUPPORTED_TRANSFER_SYNTAX` | Transfer Syntax 暂不支持。<br>The Transfer Syntax is not supported yet. |
| `DICOM_DECODE_FAILED` | DICOM 解码或注册失败。<br>DICOM decoding or registration failed. |
| `VIEWPORT_INIT_FAILED` | Cornerstone 初始化失败。<br>Cornerstone initialization failed. |
| `VIEWPORT_RENDER_FAILED` | viewport 渲染失败。<br>The viewport failed to render. |
| `JPEG_EXPORT_FAILED` | JPEG 编码失败。<br>JPEG encoding failed. |
| `ZIP_EXPORT_FAILED` | ZIP 打包失败。<br>ZIP packaging failed. |
| `PRIVACY_RULE_VIOLATION` | 隐私规则被违反。<br>A privacy rule was violated. |

## 原则 / Principles

单个文件失败不阻断整体任务；UI 显示可读提示，控制台可记录调试上下文。<br>
A single-file failure must not block the overall task; the UI should show a readable message, and the console may record debugging context.
