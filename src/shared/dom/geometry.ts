export interface RectLike {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function rectsIntersect(a: RectLike, b: RectLike): boolean {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}
