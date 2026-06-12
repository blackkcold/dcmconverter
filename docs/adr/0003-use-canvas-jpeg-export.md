# ADR 0003: Use Canvas JPEG Export

## Status

Accepted

## Decision

JPEG 导出使用当前 viewer canvas 克隆后绘制 overlay，再调用 `canvas.toBlob('image/jpeg')`。

## Consequences

导出结果明确是当前渲染视图，不等价于原始 DICOM 像素数据。
