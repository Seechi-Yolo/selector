import { REMOVE_CONFIRM_WINDOW_MS } from "./session-constants";

export interface RemoveArm {
  targetId: string | null;
  armedAtMs: number | null;
}

export function initialRemoveArm(): RemoveArm {
  return { targetId: null, armedAtMs: null };
}

export interface RemoveClickOutcome {
  next: RemoveArm;
  executeRemove: boolean;
}

export function applyRemoveClick(
  arm: RemoveArm,
  targetId: string,
  nowMs: number,
  windowMs: number = REMOVE_CONFIRM_WINDOW_MS,
): RemoveClickOutcome {
  if (arm.targetId === targetId && arm.armedAtMs != null && nowMs - arm.armedAtMs <= windowMs) {
    return { next: initialRemoveArm(), executeRemove: true };
  }
  return { next: { targetId, armedAtMs: nowMs }, executeRemove: false };
}

export function disarmRemove(_arm: RemoveArm): RemoveArm {
  return initialRemoveArm();
}
