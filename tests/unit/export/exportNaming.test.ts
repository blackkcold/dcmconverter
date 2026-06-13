import { describe, expect, it } from 'vitest';

import {
  createExportArchiveFileName,
  normalizeExportPackageName,
  resolveFileNameTemplateFields
} from '@/export/exportNaming';

describe('exportNaming', () => {
  it('normalizes export package names for folder roots and ZIP downloads', () => {
    expect(normalizeExportPackageName('  研究/导出.zip  ')).toBe('研究_导出');
    expect(createExportArchiveFileName('  研究/导出.zip  ')).toBe('研究_导出.zip');
  });

  it('falls back to the preset field set when the custom list is empty', () => {
    expect(
      resolveFileNameTemplateFields({
        fileNameTemplateMode: 'fields',
        fileNameTemplatePreset: 'series',
        fileNameTemplateFields: []
      })
    ).toEqual(['studyDate', 'protocolName', 'seriesDescription', 'instanceNumber']);
  });
});
