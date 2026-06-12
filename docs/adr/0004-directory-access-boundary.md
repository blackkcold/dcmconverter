# ADR 0004: Directory Access Boundary

## Status

Accepted

## Decision

目录读取仅使用用户主动选择目录后的 `FileList` 和 `webkitRelativePath`。

## Consequences

符合浏览器安全模型；不支持静默路径扫描。
