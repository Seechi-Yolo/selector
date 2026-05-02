import { describe, expect, it } from "vitest";
import { FORMATION_QUIET_MS } from "./session-constants";
import { isShiftFormationQuietDone } from "./formation-window";

describe("Formation window (D-12)", () => {
  it("安静期满 500ms 可提交", () => {
    expect(isShiftFormationQuietDone(0, FORMATION_QUIET_MS)).toBe(true);
    expect(isShiftFormationQuietDone(0, FORMATION_QUIET_MS - 1)).toBe(false);
  });
});
