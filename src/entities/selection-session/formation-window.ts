import { FORMATION_QUIET_MS } from "./session-constants";

/** PRD D-12：Shift 链最后一次变更起安静期是否已满 */
export function isShiftFormationQuietDone(lastChangeAtMs: number, nowMs: number): boolean {
  return nowMs - lastChangeAtMs >= FORMATION_QUIET_MS;
}
