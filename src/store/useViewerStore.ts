import { create } from 'zustand';

import type { ViewerStateSnapshot } from '@/viewer/viewerTypes';

interface ViewerStore extends ViewerStateSnapshot {
  setWindowLevel(center: number, width: number): void;
  setZoom(zoom: number): void;
  setPan(pan: { x: number; y: number }): void;
  resetViewport(): void;
}

const initialState: ViewerStateSnapshot = {
  zoom: 1,
  pan: { x: 0, y: 0 },
  invert: false,
  toolMode: 'windowLevel'
};

export const useViewerStore = create<ViewerStore>((set) => ({
  ...initialState,
  setWindowLevel: (windowCenter, windowWidth) =>
    set({ windowCenter, windowWidth }),
  setZoom: (zoom) => set({ zoom: Math.max(0.1, zoom) }),
  setPan: (pan) => set({ pan }),
  resetViewport: () => set(initialState)
}));
