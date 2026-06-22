import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const viewport = {
    setStack: vi.fn(),
    render: vi.fn()
  };
  let viewportEnabled = false;
  const renderingEngine = {
    enableElement: vi.fn(() => {
      viewportEnabled = true;
    }),
    disableElement: vi.fn(() => {
      viewportEnabled = false;
    }),
    getViewport: vi.fn(() => (viewportEnabled ? viewport : undefined)),
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
    addFileToCornerstoneFileManager: vi.fn(),
    resetViewportEnabled: () => {
      viewportEnabled = false;
    }
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

describe('viewportController', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.resetViewportEnabled();
    mocks.initializeCornerstone.mockResolvedValue({ ok: true, value: undefined });
    mocks.addFileToCornerstoneFileManager.mockResolvedValue({
      ok: true,
      value: 'dicomfile:0'
    });
    mocks.viewport.setStack.mockResolvedValue(undefined);
  });

  it('loads a single-image stack using image index 0', async () => {
    const { renderDicomFileToElement } = await import('@/viewer/viewportController');
    const file = new File(['DICM'], 'scan.dcm');
    const element = document.createElement('div');

    const result = await renderDicomFileToElement(file, element);

    expect(result.ok).toBe(true);
    expect(mocks.viewport.setStack).toHaveBeenCalledWith(['dicomfile:0'], 0);
    expect(mocks.viewport.render).toHaveBeenCalledTimes(1);
  });

  it('reuses the enabled viewport when rendering another file into the same element', async () => {
    const { renderDicomFileToElement } = await import('@/viewer/viewportController');
    const firstFile = new File(['DICM'], 'first.dcm');
    const secondFile = new File(['DICM'], 'second.dcm');
    const element = document.createElement('div');

    mocks.addFileToCornerstoneFileManager
      .mockResolvedValueOnce({ ok: true, value: 'dicomfile:0' })
      .mockResolvedValueOnce({ ok: true, value: 'dicomfile:1' });

    const firstResult = await renderDicomFileToElement(firstFile, element);
    const secondResult = await renderDicomFileToElement(secondFile, element);

    expect(firstResult.ok).toBe(true);
    expect(secondResult.ok).toBe(true);
    expect(mocks.RenderingEngine).toHaveBeenCalledTimes(1);
    expect(mocks.renderingEngine.enableElement).toHaveBeenCalledTimes(1);
    expect(mocks.renderingEngine.disableElement).not.toHaveBeenCalled();
    expect(mocks.viewport.setStack).toHaveBeenNthCalledWith(1, ['dicomfile:0'], 0);
    expect(mocks.viewport.setStack).toHaveBeenNthCalledWith(2, ['dicomfile:1'], 0);
  });
});
