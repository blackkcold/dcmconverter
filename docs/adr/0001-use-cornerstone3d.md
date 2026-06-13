# ADR 0001: Use Cornerstone3D / 使用 Cornerstone3D

## Status / 状态

Accepted / 已接受

## Context / 背景

项目需要浏览器端 DICOM 渲染、窗宽窗位、缩放、平移和压缩 DICOM 解码能力。<br>
The project needs browser-side DICOM rendering, window/level, zoom, pan, and compressed DICOM decoding.

## Decision / 决策

采用 Cornerstone3D：`@cornerstonejs/core`、`@cornerstonejs/tools`、`@cornerstonejs/dicom-image-loader`。<br>
Use Cornerstone3D: `@cornerstonejs/core`, `@cornerstonejs/tools`, and `@cornerstonejs/dicom-image-loader`.

## Consequences / 影响

优点是生态成熟、MIT 许可、适合 Web 医学影像。代价是 API 和 codec 版本兼容需要持续验证。<br>
The advantages are a mature ecosystem, MIT licensing, and a good fit for web medical imaging. The tradeoff is that API and codec version compatibility must be validated continuously.
