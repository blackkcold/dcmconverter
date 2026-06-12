# F5 功能规格：关键信息烧录

## 目标

把关键 metadata 和非诊断声明绘制到 JPEG canvas。

## 默认匿名

- PatientName：`Anonymous`
- PatientID：`Hidden`
- BirthDate、AccessionNumber、InstitutionName、ReferringPhysicianName 不显示。

## 验收标准

- 默认匿名模式不渲染患者姓名和 ID 原文。
- 显示 Modality、SeriesNumber、InstanceNumber。
- 显示 WindowCenter / WindowWidth。
- 显示非诊断水印。
