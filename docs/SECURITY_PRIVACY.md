# Security And Privacy

## 本地处理

项目不设计上传接口。浏览器只能读取用户通过文件选择器或目录选择器授权的文件。

## 默认匿名

默认导出选项开启 `anonymizeOverlay`。PatientName 显示 `Anonymous`，PatientID 显示 `Hidden`。

## 风险提示

V1 不自动识别或清除像素内烧录的患者信息。用户导出前需要确认图像内容。
