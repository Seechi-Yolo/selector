/** PRD D-17：轴对齐包络矩形 */

export interface AxisRect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function unionBounds(rects: AxisRect[]): AxisRect | null {
  if (rects.length === 0) return null;
  let minX = rects[0].minX;
  let minY = rects[0].minY;
  let maxX = rects[0].maxX;
  let maxY = rects[0].maxY;
  for (let i = 1; i < rects.length; i++) {
    const r = rects[i];
    minX = Math.min(minX, r.minX);
    minY = Math.min(minY, r.minY);
    maxX = Math.max(maxX, r.maxX);
    maxY = Math.max(maxY, r.maxY);
  }
  return { minX, minY, maxX, maxY };
}
