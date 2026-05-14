import type { ReactElement } from "react";
import type { SelectionSessionState } from "../../../entities/selection-session";
import type { PanelTag } from "../../editor-panel/panel-tag";
import "./design-tokens.css";
import "./selection-session-panel.css";

const ICON_CLOSE = (
  <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden>
    <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export interface SelectionSessionPanelProps {
  session: SelectionSessionState;
  tags: PanelTag[];
  layout: "floating" | "sandbox";
  toastMessage: string | null;
  userHasManualCopiedOnce: boolean;
  onClose(): void;
  onTagFocusRequest(tagId: PanelTag["id"]): void;
}

function SelectedFocusPill(props: { tag: PanelTag | null }): ReactElement | null {
  if (!props.tag) return null;
  return (
    <aside className="sel-session-focus-pill" aria-label="当前选中元素">
      <span className="sel-session-focus-pill__label" title={props.tag.label}>
        {props.tag.label}
      </span>
    </aside>
  );
}

function SelectedPillList(props: { tags: PanelTag[]; focusId: string | null }): ReactElement | null {
  if (props.tags.length === 0) return null;
  return (
    <aside className="sel-session-focus-pill-list" aria-label="当前选中元素列表">
      {props.tags.map((tag) => {
        const isFocus = props.focusId != null && tag.id === props.focusId;
        return (
          <div key={tag.id} className="sel-session-focus-pill" data-focus={isFocus ? "1" : "0"}>
            <span className="sel-session-focus-pill__label" title={tag.label}>
              {tag.label}
            </span>
          </div>
        );
      })}
    </aside>
  );
}

export function SelectionSessionPanel(props: SelectionSessionPanelProps) {
  const paused = props.session.picking === "paused";
  const n = props.tags.length;
  const focusId = props.session.focusElementId ?? (n === 1 ? props.tags[0]?.id ?? null : null);
  const focusTag = focusId ? props.tags.find((t) => t.id === focusId) ?? null : null;

  const rootClass =
    "sel-volt sel-session-panel" +
    (props.layout === "floating" ? " sel-session-panel--floating-strip" : " sel-session-panel--sandbox");

  const strip = (
    <div className="sel-session-strip" data-paused={paused ? "1" : "0"}>
      <div className="sel-session-drag sel-session-drag--pill" data-sel-drag-handle aria-label="选取状态">
        <span className="sel-session-dot" data-paused={paused ? "1" : "0"} />
      </div>

      <button
        type="button"
        className="sel-session-icon-btn sel-session-icon-btn--pill"
        onClick={props.onClose}
        title="关闭会话：清除页上选取并结束本次选取"
        aria-label="关闭会话：清除页上选取并结束本次选取"
      >
        {ICON_CLOSE}
      </button>
    </div>
  );

  if (props.layout === "floating") {
    return (
      <div className={rootClass}>
        <div className="sel-session-chrome">
          {props.tags.length <= 1 ? <SelectedFocusPill tag={focusTag} /> : <SelectedPillList tags={props.tags} focusId={focusId} />}
          {strip}
        </div>
      </div>
    );
  }

  return (
    <div className={rootClass}>
      <div className="sel-session-chrome sel-session-chrome--sandbox">
        {props.tags.length <= 1 ? <SelectedFocusPill tag={focusTag} /> : <SelectedPillList tags={props.tags} focusId={focusId} />}
        {strip}
      </div>
    </div>
  );
}
