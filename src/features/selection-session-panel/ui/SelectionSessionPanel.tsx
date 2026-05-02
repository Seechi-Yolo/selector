import { useMemo } from "react";
import type { SelectionSessionState } from "../../../entities/selection-session";
import { mapSelectionSessionToPresentation } from "../map-selection-session-to-presentation";
import type { PanelTag } from "../../editor-panel/panel-tag";
import "./design-tokens.css";
import "./selection-session-panel.css";
import { ShinyText } from "./react-bits/shiny-text";

const ICON_MINIMIZE = (
  <svg width="10" height="2" viewBox="0 0 10 2" fill="none" aria-hidden>
    <line x1="0" y1="1" x2="10" y2="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ICON_EXPAND = (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
    <path d="M1 7L5 3L9 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ICON_CLOSE = (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
    <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export interface SelectionSessionPanelProps {
  session: SelectionSessionState;
  tags: PanelTag[];
  minimized: boolean;
  layout: "floating" | "sandbox";
  toastMessage: string | null;
  userHasManualCopiedOnce: boolean;
  onMinimize(): void;
  onClose(): void;
  onRemove(id: PanelTag["id"]): void;
  onClear(): void;
}

function primaryGuidanceCopy(scene: ReturnType<typeof mapSelectionSessionToPresentation>["guidance"]["primaryScene"]): string {
  switch (scene) {
    case "empty_active":
      return "在页面上点击要修改的元素，开始本次选取。";
    case "empty_paused":
      return "已暂停点选。按 Space 恢复后，可继续点击添加选取。";
    case "has_selection":
      return "已选内容在上方；需要说明时，请点击对应「编辑说明」。";
    default: {
      const _x: never = scene;
      return _x;
    }
  }
}

export function SelectionSessionPanel(props: SelectionSessionPanelProps) {
  const presentation = useMemo(
    () =>
      mapSelectionSessionToPresentation({
        session: props.session,
        userHasManualCopiedOnce: props.userHasManualCopiedOnce,
      }),
    [props.session, props.userHasManualCopiedOnce],
  );

  const paused = props.session.picking === "paused";
  const primary = primaryGuidanceCopy(presentation.guidance.primaryScene);
  const useShiny = presentation.guidance.primaryScene !== "has_selection";

  const rootClass =
    "sel-volt sel-session-panel" +
    (props.minimized ? " sel-session-minimized" : "") +
    (props.layout === "sandbox" ? " sel-session-panel--sandbox" : "");

  return (
    <div className={rootClass}>
      <header className="sel-session-drag" data-sel-drag-handle>
        <div className="sel-session-title">
          <span className="sel-session-dot" data-paused={paused ? "1" : "0"} />
          <span className="sel-session-status">{paused ? "已暂停选取" : "选取"}</span>
        </div>
        <div className="sel-session-actions">
          <button type="button" className="sel-session-icon-btn" onClick={props.onMinimize} title="最小化">
            {props.minimized ? ICON_EXPAND : ICON_MINIMIZE}
          </button>
          <button type="button" className="sel-session-icon-btn" onClick={props.onClose} title="关闭">
            {ICON_CLOSE}
          </button>
        </div>
      </header>

      <div className="sel-session-body">
        <section className="sel-session-selected" aria-label="已选内容">
          <div className="sel-session-selected-head">已选内容</div>
          {props.tags.length === 0 ? (
            <p style={{ margin: 0, fontSize: 12, color: "var(--sel-slate)" }}>暂无已选项</p>
          ) : null}
          <div className="sel-session-tags" data-empty={props.tags.length === 0 ? "1" : "0"}>
            {props.tags.map((tag, index) => (
              <span key={tag.id} className="sel-session-tag">
                <span className="sel-session-tag-num">{index + 1}</span>
                <span className="sel-session-tag-label">
                  {tag.label}
                  {tag.hasAnnotation ? " *" : ""}
                </span>
                <button
                  type="button"
                  className="sel-session-tag-x"
                  title="点击移除操作"
                  aria-label="从选取中移除此项"
                  onClick={(event) => {
                    event.stopPropagation();
                    props.onRemove(tag.id);
                  }}
                >
                  ×
                </button>
              </span>
            ))}
            {props.tags.length > 0 ? (
              <button type="button" className="sel-session-clear" onClick={props.onClear}>
                清空选取
              </button>
            ) : null}
          </div>
        </section>

        <section className="sel-session-guidance" aria-label="操作引导">
          <p className="sel-session-guidance-primary">
            {useShiny ? <ShinyText text={primary} durationSec={6} /> : primary}
          </p>
          <div className="sel-session-guidance-secondary">
            <span>
              <kbd className="sel-session-kbd">Space</kbd> 暂停/继续
            </span>
            <span>
              <kbd className="sel-session-kbd">Esc</kbd> 关闭说明 / 清空
            </span>
            {presentation.guidance.showClipboardAuxiliaryHints ? (
              <span>
                已自动同步复制提示词；也可用 <kbd className="sel-session-kbd">⌘/Ctrl</kbd>
                <kbd className="sel-session-kbd">C</kbd> 再次复制同文。
              </span>
            ) : null}
          </div>
          {props.toastMessage ? <div className="sel-session-toast">{props.toastMessage}</div> : null}
        </section>
      </div>
    </div>
  );
}
