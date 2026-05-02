import { describe, expect, it } from "vitest";
import { unionBounds } from "./union-bounds";

describe("Union bounds (D-17)", () => {
  it("Given 多矩形 When union Then 取轴对齐包络", () => {
    const u = unionBounds([
      { minX: 0, minY: 0, maxX: 10, maxY: 10 },
      { minX: 5, minY: 5, maxX: 20, maxY: 8 },
    ]);
    expect(u).toEqual({ minX: 0, minY: 0, maxX: 20, maxY: 10 });
  });

  it("Given 空列表 When union Then null", () => {
    expect(unionBounds([])).toBeNull();
  });
});
