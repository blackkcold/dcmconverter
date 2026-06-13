# ADR 0003: Use Canvas JPEG Export / 使用 Canvas JPEG 导出

## Status / 状态

Accepted / 已接受

## Decision / 决策

JPEG 导出使用当前 viewer canvas 克隆后绘制 overlay，再调用 `canvas.toBlob('image/jpeg')`。<br>
JPEG export clones the current viewer canvas, draws the overlay, and then calls `canvas.toBlob('image/jpeg')`.

## Consequences / 影响

导出结果明确是当前渲染视图，不等价于原始 DICOM 像素数据。<br>
The export is explicitly the current rendered view and is not equivalent to the original DICOM pixel data.
