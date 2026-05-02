import { CLIPBOARD_DEBOUNCE_MS } from "./session-constants";
import type { SelectionSessionState } from "./session-model";

export interface ClipboardWriteIntent {
  flushAtMs: number | null;
}

export function initialClipboardWriteIntent(): ClipboardWriteIntent {
  return { flushAtMs: null };
}

/**
 * 与 `buildPromptText` 对齐的底线：有已选项即视为可拼装非空主内容（元素元数据由宿主读 DOM 填充）。
 * 「仅有草稿无选取」不写；「有选取」即使尚无说明正文也允许 D-08 排程（复制体由装配层决定）。
 */
export function hasWritableComposedPrompt(state: SelectionSessionState): boolean {
  return state.selectionCount > 0;
}

/** D-08 +「无可写内容不写」：仅在有可写正文时排程 */
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
