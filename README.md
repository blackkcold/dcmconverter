# Local DICOM JPEG Tool

  <a href="https://blackkcold.github.io/dcmconverter/">
    <img alt="Live Demo" src="https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-1f883d?style=for-the-badge">
  </a>
  <a href="https://github.com/blackkcold/dcmconverter/releases">
    <img alt="Releases" src="https://img.shields.io/github/v/release/blackkcold/dcmconverter?style=for-the-badge&label=Releases&color=0b7285">
  </a>
  <a href="LICENSE">
    <img alt="License Valid" src="https://img.shields.io/badge/License-Valid-2ea44f?style=for-the-badge">
  </a>

> [!TIP]
> 在线体验 / Live demo: <https://blackkcold.github.io/dcmconverter/>
> 发布页 / Releases: <https://github.com/blackkcold/dcmconverter/releases>

> [!IMPORTANT]
> 本项目仅用于非诊断用途，所有文件都在浏览器本地处理，不上传服务器。
> This project is for non-diagnostic use only, and all files are processed locally in the browser without being uploaded to a server.

## 快速导航 / Quick Links
| 项目 | 链接 |
| --- | --- |
| 在线体验 / Live demo | <https://blackkcold.github.io/dcmconverter/> |
| 发布页 / Releases | <https://github.com/blackkcold/dcmconverter/releases> |
| 许可 / License | [LICENSE](LICENSE) |
| 许可说明 / License Guide | [docs/LICENSE_GUIDE.md](docs/LICENSE_GUIDE.md) |
| 产品说明 / Product doc | [docs/README_PRODUCT.md](docs/README_PRODUCT.md) |
| 安全与隐私 / Security & Privacy | [docs/SECURITY_PRIVACY.md](docs/SECURITY_PRIVACY.md) |

## 简介 / Overview
本项目是一个本地优先的浏览器端 DICOM 查看与 JPEG 导出工具。所有文件都在浏览器内处理，不上传服务器；导出的 JPEG 仅用于非诊断场景，展示的是当前渲染结果。

This project is a local-first browser tool for viewing DICOM files and exporting JPEG images. All files are processed entirely in the browser and are never uploaded to a server; exported JPEGs are for non-diagnostic use and reflect the current rendered view.

## 一眼看懂 / At a Glance
| 能力 / Capability | 说明 / Description |
| --- | --- |
| 本地导入 / Local import | 支持单个或多个 `.dcm / .dicom / .ima` 文件，也支持目录递归导入。 |
| 浏览查看 / Viewing | 使用 Cornerstone3D 渲染本地 DICOM 文件，并提供标准化 metadata。 |
| 批量导出 / Batch export | 可导出当前图像、当前序列或全部导入文件。 |
| 文件写入 / File output | Chrome / Edge 可直接写入目标文件夹，并支持 manifest 续传。 |
| 兼容回退 / Fallback | 不支持文件夹写入的浏览器会退回 ZIP 下载。 |
| 隐私边界 / Privacy boundary | 默认本地处理，用户必须显式选择文件或目录授权。 |

## 主要特性 / Features
### 导入 / Import
- 选择单个或多个 `.dcm / .dicom / .ima` 文件。
- 通过目录选择器递归导入本地目录，并保留 `webkitRelativePath`。

### 查看 / View
- 使用 Cornerstone3D 渲染本地 DICOM 文件。
- 查看标准化 metadata，避免 UI 暴露原始 DICOM tag key。

### 导出 / Export
- 串行分批导出当前图像、当前序列或全部导入文件。
- Chrome/Edge 支持选择目标文件夹逐张写入 JPEG，并用 manifest 断点继续。
- 不支持文件夹写入的浏览器会退回 ZIP 下载。
- 导出面板可设置导出包名称和 JPEG 文件名模板，模板只提供主字段组合。

### 隐私 / Privacy
- 默认可烧录个人医疗信息；导出面板会明确提示当前模式。
- 不支持静默扫描本地磁盘路径，必须由用户通过文件/目录选择器授权。
- JPEG 底部固定显示 `Non-diagnostic JPEG · Exported from local DICOM tool`。

> [!NOTE]
> 开源协议为 MIT。你可以自由使用、复制、修改、分发和再许可，但需要保留版权声明与许可文本。
> The project is MIT licensed. You may use, copy, modify, distribute, and sublicense the software, provided that the copyright notice and license text remain included.

> [!WARNING]
> V1 只承诺标准 DICOM P10 文件，不承诺支持全部 Transfer Syntax。
> 文件名模板只暴露主字段白名单，不支持自由文本拼接。
> V1 only targets standard DICOM P10 files and does not promise support for every Transfer Syntax.
> Filename templates only expose the main-field whitelist and do not allow free-text composition.

## 本地运行 / Local Development
```bash
npm install
npm run dev
```

打开 `http://127.0.0.1:5173`。

Open `http://127.0.0.1:5173`.

## 验证命令 / Verification
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

For E2E:

```bash
npx playwright install chromium
npm run test:e2e
```

## 开源规则 / Open Source Notes
- 保留 `LICENSE` 文件中的版权和许可声明。
- 若基于本项目进行二次分发，建议保留项目名和来源链接。
- 本项目仅面向非诊断用途，不应替代专业医疗判断。

- Keep the copyright and license notice from the `LICENSE` file.
- If you redistribute a derived work, keep the project name and source links when practical.
- This project is for non-diagnostic use only and must not replace professional medical judgment.

## 回滚 / Rollback
当前版本已同步到仓库。若需要回到旧版，可直接使用 git 回退到之前的提交；若只是局部调整，可只修改 `README.md` 而不影响其他文件。

This version has been synchronized to the repository. To return to an older version, use git to roll back to a previous commit; for small tweaks, you can update only `README.md` without touching other files.
