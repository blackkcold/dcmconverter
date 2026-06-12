export function cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const target = document.createElement('canvas');
  target.width = source.width;
  target.height = source.height;

  const context = target.getContext('2d');
  if (context) {
    context.drawImage(source, 0, 0);
  }

  return target;
}
