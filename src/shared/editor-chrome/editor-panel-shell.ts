import { NS } from "../dom/constants";

export type EditorPanelShellLayout = "floating" | "sandbox";

export type EditorPanelShellMode = "shell" | "interactive";

/** 与可交互 `EditorPanel` 共用，保证壳与折叠按钮 SVG 一致 */
export const EDITOR_PANEL_ICON_MINIMIZE =
  '<svg width="10" height="2" viewBox="0 0 10 2" fill="none"><line x1="0" y1="1" x2="10" y2="1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

function shellInnerHtml(): string {
  return `
      <div class="${NS}-drag-handle">
        <span class="${NS}-drag-title">
          <span class="${NS}-status-dot"></span>
          <span class="${NS}-status-label">Selecting</span>
        </span>
        <div class="${NS}-panel-actions">
          <button type="button" class="${NS}-panel-btn" data-action="minimize" title="Minimize">${EDITOR_PANEL_ICON_MINIMIZE}</button>
          <button type="button" class="${NS}-panel-btn" data-action="close" title="Close">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="${NS}-panel-body">
        <div class="${NS}-chat-tags ${NS}-hidden"></div>
        <div class="${NS}-shortcuts">
          <span><kbd>Click</kbd> Select</span>
          <span><kbd>Shift</kbd> Multi</span>
          <span><kbd>Arrows</kbd> Navigate</span>
          <span><kbd>Space</kbd> Pause</span>
          <span><kbd>Cmd/Ctrl C</kbd> Copy</span>
          <span><kbd>Cmd/Ctrl Z</kbd> Undo</span>
          <span><kbd>Esc</kbd> Clear</span>
        </div>
        <button type="button" class="${NS}-copy-btn" disabled>Copy Prompt</button>
      </div>
    `;
}

/**
 * 主面板 DOM 壳（与 `EditorPanel` 使用同一套 `assets/editor.css` 类名），不含选取/复制等交互逻辑。
 * - `shell`：沙箱等仅展示外观；根节点带 `data-selector-editor-chrome-shell` 供主题卸载判断。
 * - `interactive`：由 `EditorPanel` 绑定事件与状态。
 */
export function createEditorPanelShellElement(options: {
  layout: EditorPanelShellLayout;
  mode: EditorPanelShellMode;
}): HTMLDivElement {
  const root = document.createElement("div");
  root.className = `${NS}-root ${NS}-chat`;
  if (options.layout === "sandbox") {
    root.classList.add(`${NS}-chat--sandbox`);
  }
  if (options.mode === "shell") {
    root.setAttribute("data-selector-editor-chrome-shell", "");
  }
  root.innerHTML = shellInnerHtml();
  if (options.mode === "shell") {
    for (const btn of root.querySelectorAll<HTMLButtonElement>(`.${NS}-panel-btn`)) {
      btn.disabled = true;
      btn.setAttribute("tabindex", "-1");
    }
    const copy = root.querySelector<HTMLButtonElement>(`.${NS}-copy-btn`);
    if (copy) {
      copy.disabled = true;
      copy.setAttribute("tabindex", "-1");
    }
  }
  return root;
}

/** 仅为视觉占位：标签区结构与 `EditorPanel.renderTags` 相近，无回调、无 data-ai-id。 */
export function paintShellSampleTags(
  root: HTMLElement,
  samples: readonly { label: string; hasAnnotation: boolean }[],
): void {
  const container = root.querySelector<HTMLElement>(`.${NS}-chat-tags`)!;
  const copyBtn = root.querySelector<HTMLButtonElement>(`.${NS}-copy-btn`)!;
  container.innerHTML = "";

  if (samples.length === 0) {
    container.classList.add(`${NS}-hidden`);
    copyBtn.disabled = true;
    return;
  }

  container.classList.remove(`${NS}-hidden`);
  copyBtn.disabled = true;

  samples.forEach((sample, index) => {
    const item = document.createElement("span");
    item.className = `${NS}-tag`;
    const label = document.createElement("span");
    label.className = `${NS}-tag-label`;
    label.textContent = `${sample.label}${sample.hasAnnotation ? " *" : ""}`;
    const num = document.createElement("span");
    num.className = `${NS}-tag-num`;
    num.textContent = String(index + 1);
    const fauxRemove = document.createElement("button");
    fauxRemove.type = "button";
    fauxRemove.className = `${NS}-tag-x`;
    fauxRemove.disabled = true;
    fauxRemove.setAttribute("tabindex", "-1");
    fauxRemove.title = "Remove";
    fauxRemove.textContent = "x";
    item.append(num, label, fauxRemove);
    container.appendChild(item);
  });

  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className = `${NS}-tags-action`;
  clearBtn.title = "Clear all";
  clearBtn.disabled = true;
  clearBtn.setAttribute("tabindex", "-1");
  clearBtn.textContent = "Clear";
  container.appendChild(clearBtn);
}
