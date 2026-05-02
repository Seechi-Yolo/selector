import { describe, expect, it } from "vitest";
import { CLIPBOARD_DEBOUNCE_MS } from "./session-constants";
import {
  hasWritableComposedPrompt,
  initialClipboardWriteIntent,
  scheduleClipboardAfterPromptChange,
  shouldFlushClipboard,
} from "./clipboard-write-intent";
import { initialSelectionSessionState } from "./session-model";

describe("Clipboard write intent", () => {
  it("Given 空选取 When 调度 Then flush 为 null", () => {
    const s = initialSelectionSessionState();
    const clip = scheduleClipboardAfterPromptChange(initialClipboardWriteIntent(), s, 100);
    expect(clip.flushAtMs).toBeNull();
  });

  it("Given 有选取无草稿 When 调度 Then at + 500ms", () => {
    const s = { ...initialSelectionSessionState(), selectionCount: 2 };
    expect(hasWritableComposedPrompt(s)).toBe(true);
    const clip = scheduleClipboardAfterPromptChange(initialClipboardWriteIntent(), s, 200);
    expect(clip.flushAtMs).toBe(200 + CLIPBOARD_DEBOUNCE_MS);
  });

  it("Given 有逐项正文 When 调度 Then at + 500ms", () => {
    const s = {
      ...initialSelectionSessionState(),
      selectionCount: 1,
      drafts: { selectionLevelBody: "", perItemBodies: { a: "x" } },
    };
    expect(hasWritableComposedPrompt(s)).toBe(true);
    const clip = scheduleClipboardAfterPromptChange(initialClipboardWriteIntent(), s, 200);
    expect(clip.flushAtMs).toBe(200 + CLIPBOARD_DEBOUNCE_MS);
  });

  it("Given flush 已到期 When shouldFlush Then true", () => {
    const clip = { flushAtMs: 500 };
    expect(shouldFlushClipboard(clip, 500)).toBe(true);
  });
});
