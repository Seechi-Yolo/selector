import { CLIPBOARD_DEBOUNCE_MS } from "./session-constants";
import type { SelectionSessionState } from "./session-model";

export interface ClipboardWriteIntent {
  flushAtMs: number | null;
}

export function initialClipboardWriteIntent(): ClipboardWriteIntent {
  return { flushAtMs: null };
}

/**
 * 领域层粗判：有已选项才值得在变更后尝试 D-08 防抖。
 * 宿主在真正写入前仍须用 `wouldCopyPromptProduceText`（与 `buildPromptText` 一致）过滤空串。
 */
export function hasWritableComposedPrompt(state: SelectionSessionState): boolean {
  return state.selectionCount > 0;
}

/** D-08：有选取即排程；flush 时由宿主判断是否产生非空正文 */
export function scheduleClipboardAfterPromptChange(
  _intent: ClipboardWriteIntent,
  nextState: SelectionSessionState,
  changeAtMs: number,
): ClipboardWriteIntent {
  if (!hasWritableComposedPrompt(nextState)) {
    return { flushAtMs: null };
  }
  return { flushAtMs: changeAtMs + CLIPBOARD_DEBOUNCE_MS };
}

export function shouldFlushClipboard(intent: ClipboardWriteIntent, nowMs: number): boolean {
  return intent.flushAtMs != null && nowMs >= intent.flushAtMs;
}
