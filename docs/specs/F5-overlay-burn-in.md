# F5 功能规格：关键信息烧录 / F5 Functional Spec: Key Information Burn-In

## 目标 / Goal

把关键 metadata 和非诊断声明绘制到 JPEG canvas。<br>
Render key metadata and the non-diagnostic statement onto the JPEG canvas.

## 默认匿名 / Default Anonymization

- PatientName：`Anonymous`。<br>PatientName: `Anonymous`.
- PatientID：`Hidden`。<br>PatientID: `Hidden`.
- BirthDate、AccessionNumber、InstitutionName、ReferringPhysicianName 不显示。<br>BirthDate, AccessionNumber, InstitutionName, and ReferringPhysicianName are not displayed.

## 验收标准 / Acceptance Criteria

- 默认匿名模式不渲染患者姓名和 ID 原文。<br>The default anonymization mode does not render the original patient name or ID.
- 显示 Modality、SeriesNumber、InstanceNumber。<br>Modality, SeriesNumber, and InstanceNumber are shown.
- 显示 WindowCenter / WindowWidth。<br>WindowCenter / WindowWidth are shown.
- 显示非诊断水印。<br>The non-diagnostic watermark is shown.
