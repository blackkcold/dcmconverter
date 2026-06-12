import type { WindowLevel } from './viewerTypes';

export const DEFAULT_WINDOW_LEVEL: WindowLevel = {
  center: 40,
  width: 400
};

export function normalizeWindowLevel(
  center: number | undefined,
  width: number | undefined
): WindowLevel {
  return {
    center: Number.isFinite(center) ? Number(center) : DEFAULT_WINDOW_LEVEL.center,
    width:
      Number.isFinite(width) && Number(width) > 0
        ? Number(width)
        : DEFAULT_WINDOW_LEVEL.width
  };
}

export function adjustWindowLevel(
  current: WindowLevel,
  deltaCenter: number,
  deltaWidth: number
): WindowLevel {
  return {
    center: current.center + deltaCenter,
    width: Math.max(1, current.width + deltaWidth)
  };
}

export interface VoiRange {
  lower: number;
  upper: number;
}

export function windowLevelToVoiRange(windowLevel: WindowLevel): VoiRange {
  const normalized = normalizeWindowLevel(windowLevel.center, windowLevel.width);
  const halfWidth = normalized.width / 2;

  return {
    lower: normalized.center - halfWidth,
    upper: normalized.center + halfWidth
  };
}
