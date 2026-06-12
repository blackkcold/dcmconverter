export function getNextStackIndex(
  currentIndex: number,
  total: number,
  direction: 1 | -1
): number {
  if (total <= 0) {
    return -1;
  }

  return clamp(currentIndex + direction, 0, total - 1);
}

export function clamp(index: number, min: number, max: number): number {
  return Math.min(Math.max(index, min), max);
}
