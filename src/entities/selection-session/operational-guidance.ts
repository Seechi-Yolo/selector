/** PRD D-09 */
export type GuidanceLineRole = "primary" | "secondary";

export interface GuidanceLine {
  role: GuidanceLineRole;
  body: string;
}

export function sortGuidanceLines(lines: GuidanceLine[]): GuidanceLine[] {
  return [...lines].sort((a, b) => {
    if (a.role === b.role) return 0;
    return a.role === "primary" ? -1 : 1;
  });
}

/** PRD D-15：手动复制成功前隐藏辅句 */
export function clipboardAuxiliaryHintsVisible(userHasManualCopiedOnce: boolean): boolean {
  return userHasManualCopiedOnce;
}
