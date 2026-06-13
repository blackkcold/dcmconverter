# Local DICOM JPEG Tool

[![Release](https://img.shields.io/github/v/release/blackkcold/dcmconverter?display_name=tag&label=release)](https://github.com/blackkcold/dcmconverter/releases)
[![License](https://img.shields.io/github/license/blackkcold/dcmconverter)](./LICENSE)
[![Demo](https://img.shields.io/badge/demo-GitHub%20Pages-brightgreen)](https://blackkcold.github.io/dcmconverter/)

本项目是一个本地优先的浏览器端 DICOM 查看与 JPEG 导出工具。文件只在浏览器内处理，不上传服务器；导出的 JPEG 仅用于非诊断用途。

> [!NOTE]
> 适合在浏览器中本地浏览 DICOM 文件、查看标准化 metadata，并导出 JPEG。
>
> 目标是把“本地可控、无需后端”的工作流做得稳定、清晰、可回溯。

> [!TIP]
> Chrome / Edge 支持直接选择目标文件夹逐张写入 JPEG，并通过 manifest 断点续传。
>
> 其他浏览器会自动回退为 ZIP 下载，依然可以完成导出。

> [!WARNING]
> 不要把真实患者数据提交到仓库。
>
> 导出的 JPEG 也不应被视为诊断结果。

## 目录

- [功能亮点](#功能亮点)
- [在线访问](#在线访问)
- [Changelog](#changelog)
- [快速开始](#快速开始)
- [运行说明](#运行说明)
- [使用说明](#使用说明)
- [开源许可](#开源许可)

## 功能亮点

| 能力 | 说明 |
| --- | --- |
| 本地导入 | 支持单个或多个 `.dcm / .dicom / .ima` 文件。 |
| 目录递归 | 通过目录选择器导入本地目录，并保留 `webkitRelativePath`。 |
| 影像查看 | 使用 Cornerstone3D 渲染本地 DICOM 文件。 |
| 元数据展示 | 只展示标准化 metadata，避免 UI 暴露原始 DICOM tag key。 |
| 批量导出 | 支持当前图像、当前序列或全部导入文件的串行分批导出。 |
| 文件夹写入 | Chrome / Edge 可逐张写入 JPEG，并用 manifest 继续中断任务。 |
| 降级方案 | 不支持文件夹写入的浏览器会回退 ZIP 下载。 |
| 隐私提示 | 导出面板会明确提示当前是否包含个人医疗信息。 |

## 在线访问

- 在线体验：<https://blackkcold.github.io/dcmconverter/>
- 发布页：<https://github.com/blackkcold/dcmconverter/releases>

## Changelog

### v0.1.0 · 2026-06-13

- 首个正式发布版本。
- 支持浏览器本地加载 DICOM 文件与目录。
- 支持当前图像、当前序列和全部导出 JPEG。
- Chrome / Edge 可直接选择目标文件夹逐张写入。
- 不支持文件夹写入时自动回退 ZIP 下载。
- 默认导出会明确提示当前是否包含个人信息。

## 快速开始

```bash
npm install
npm run dev
```

打开 `http://127.0.0.1:5173`。

## 运行说明

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npx playwright --version
```

如需 E2E：

```bash
npx playwright install chromium
npm run test:e2e
```

## 使用说明

### 导入

- 选择单个或多个 DICOM 文件。
- 或者直接选择一个本地目录，递归导入其中的文件。

### 查看

- 在 viewer 中查看当前影像与标准化 metadata。
- 系统不会要求静默扫描本地磁盘路径。

### 导出

- 可导出当前图像、当前序列或全部导入文件。
- Chrome / Edge 支持写入目标文件夹。
- 其他浏览器会回退 ZIP 下载。

### 重要说明

- V1 只承诺标准 DICOM P10 文件，不承诺支持全部 Transfer Syntax。
- 不支持静默扫描本地磁盘路径，必须由用户通过文件 / 目录选择器授权。
- 默认个人使用导出：可烧录 `PatientName` / `PatientID`。关闭“包含个人信息”后，匿名规则生效。
- JPEG 底部固定显示：`Non-diagnostic JPEG · Exported from local DICOM tool`。

## 开源许可

本项目采用 MIT License。

- 允许自由使用、复制、修改、合并、发布、分发、再许可和出售。
- 分发时需要保留原始版权声明与许可文本。
- 软件按“现状”提供，不提供任何明示或暗示担保。
