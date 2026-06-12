# Error Handling

## 错误码

| Code | 含义 |
|---|---|
| `FILE_NOT_DICOM` | 文件不属于 DICOM 候选 |
| `FILE_READ_FAILED` | 浏览器读取文件失败 |
| `DICOM_PARSE_FAILED` | metadata 解析失败 |
| `DICOM_UNSUPPORTED_TRANSFER_SYNTAX` | Transfer Syntax 暂不支持 |
| `DICOM_DECODE_FAILED` | DICOM 解码或注册失败 |
| `VIEWPORT_INIT_FAILED` | Cornerstone 初始化失败 |
| `VIEWPORT_RENDER_FAILED` | viewport 渲染失败 |
| `JPEG_EXPORT_FAILED` | JPEG 编码失败 |
| `ZIP_EXPORT_FAILED` | ZIP 打包失败 |
| `PRIVACY_RULE_VIOLATION` | 隐私规则被违反 |

## 原则

单个文件失败不阻断整体任务；UI 显示可读提示，控制台可记录调试上下文。
