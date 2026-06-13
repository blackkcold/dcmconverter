# Local DICOM JPEG Tool

本项目是一个本地优先的浏览器端 DICOM 查看与 JPEG 导出工具。文件只在浏览器内处理，不上传服务器；导出的 JPEG 是非诊断用途的当前渲染结果。

## 在线访问

- 在线体验：<https://blackkcold.github.io/dcmconverter/>
- 发布页：<https://github.com/blackkcold/dcmconverter/releases>

## 功能范围

- 选择单个或多个 `.dcm / .dicom / .ima` 文件。
- 通过目录选择器递归导入本地目录，并保留 `webkitRelativePath`。
- 使用 Cornerstone3D 渲染本地 DICOM 文件。
- 查看标准化 metadata，避免 UI 暴露原始 DICOM tag key。
- 串行分批导出当前图像、当前序列或全部导入文件。
- Chrome/Edge 支持选择目标文件夹逐张写入 JPEG，并用 manifest 断点继续。
- 不支持文件夹写入的浏览器会退回 ZIP 下载。
- 默认可烧录个人医疗信息；导出面板会明确提示当前模式。

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://127.0.0.1:5173`。

## 验证命令

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

## 重要说明

- V1 只承诺标准 DICOM P10 文件，不承诺支持全部 Transfer Syntax。
- 不支持静默扫描本地磁盘路径，必须由用户通过文件/目录选择器授权。
- 默认个人使用导出：可烧录 `PatientName` / `PatientID`。关闭“包含个人信息”后，匿名规则生效。
- JPEG 底部固定显示：`Non-diagnostic JPEG · Exported from local DICOM tool`。

## 回滚

本次构建在分支 `codex/build-local-dicom-jpeg-tool` 上完成。若需要回到初始状态，可切回 `main` 分支；未提交前也可用 git 查看和选择性删除新增文件。
