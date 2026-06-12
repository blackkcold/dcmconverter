import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const viewport = {
    setStack: vi.fn(),
    render: vi.fn()
  };
  const renderingEngine = {
    enableElement: vi.fn(),
    getViewport: vi.fn(() => viewport),
    destroy: vi.fn()
  };
  const RenderingEngine = vi.fn(function RenderingEngineMock() {
    return renderingEngine;
  });

  return {
    viewport,
    renderingEngine,
    RenderingEngine,
    initializeCornerstone: vi.fn(),
    addFileToCornerstoneFileManager: vi.fn()
  };
});

vi.mock('@/dicom/cornerstoneInit', () => ({
  initializeCornerstone: mocks.initializeCornerstone
}));

vi.mock('@/dicom/dicomFileManager', () => ({
  addFileToCornerstoneFileManager: mocks.addFileToCornerstoneFileManager
}));

vi.mock('@cornerstonejs/core', () => ({
  RenderingEngine: mocks.RenderingEngine,
  Enums: {
    ViewportType: {
      STACK: 'stack'
    }
  }
}));

import { renderDicomFileToElement } from '@/viewer/viewportController';

describe('viewportController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.initializeCornerstone.mockResolvedValue({ ok: true, value: undefined });
    mocks.addFileToCornerstoneFileManager.mockResolvedValue({
      ok: true,
      value: 'dicomfile:0'
    });
    mocks.viewport.setStack.mockResolvedValue(undefined);
  });

  it('loads a single-image stack using image index 0', async () => {
    const file = new File(['DICM'], 'scan.dcm');
    const element = document.createElement('div');

    const result = await renderDicomFileToElement(file, element);

    expect(result.ok).toBe(true);
    expect(mocks.viewport.setStack).toHaveBeenCalledWith(['dicomfile:0'], 0);
    expect(mocks.viewport.render).toHaveBeenCalledTimes(1);
  });
});
