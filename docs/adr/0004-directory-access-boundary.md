# ADR 0004: Directory Access Boundary / 目录访问边界

## Status / 状态

Accepted / 已接受

## Decision / 决策

目录读取仅使用用户主动选择目录后的 `FileList` 和 `webkitRelativePath`。<br>
Directory reads only use the `FileList` and `webkitRelativePath` returned after the user explicitly selects a folder.

## Consequences / 影响

符合浏览器安全模型；不支持静默路径扫描。<br>
This matches the browser security model and does not support silent path scanning.
