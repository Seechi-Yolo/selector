import type { ClipboardPort } from "../../features/copy-prompt";

export class BrowserClipboard implements ClipboardPort {
  async writeText(text: string): Promise<void> {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch {
        fallbackCopy(text);
        return;
      }
    }

    fallbackCopy(text);
  }
}

function fallbackCopy(text: string): void {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.cssText = "position:fixed;opacity:0;top:0;left:0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    document.execCommand("copy");
  } catch {
    // Best effort fallback for pages where the async Clipboard API is blocked.
  }

  textarea.remove();
}
