# ADR 0001: Use Cornerstone3D

## Status

Accepted

## Context

项目需要浏览器端 DICOM 渲染、窗宽窗位、缩放、平移和压缩 DICOM 解码能力。

## Decision

采用 Cornerstone3D：`@cornerstonejs/core`、`@cornerstonejs/tools`、`@cornerstonejs/dicom-image-loader`。

## Consequences

优点是生态成熟、MIT 许可、适合 Web 医学影像。代价是 API 和 codec 版本兼容需要持续验证。
