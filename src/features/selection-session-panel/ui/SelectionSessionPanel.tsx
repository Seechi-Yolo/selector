import type { ReactElement } from "react";
import type { SelectionSessionState } from "../../../entities/selection-session";
import type { PanelTag } from "../../editor-panel/panel-tag";
import { guidanceFromSession, type GuidanceChunk, type SessionGuidanceView } from "../guidance-from-session";
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

function renderChunk(chunk: GuidanceChunk, key: string): ReactElement {
  if (chunk.kind === "kbd") {
    return (
      <kbd key={key} className="sel-session-kbd">
        {chunk.value}
      </kbd>
    );
  }
  return (
    <span key={key} className="sel-session-guidance-text">
      {chunk.value}
    </span>
  );
}

function SessionGuidance(props: { view: SessionGuidanceView }): ReactElement {
  const { view } = props;
  const primaryClass =
    "sel-session-guidance-primary" + (view.primaryUseShiny ? " sel-session-guidance-primary--shiny" : "");
  return (
    <div className="sel-session-guidance" aria-live="polite">
      {view.primaryText ? <p className={primaryClass}>{view.primaryText}</p> : null}
      {view.secondaries.length > 0 ? (
        <ul
          className={
            "sel-session-guidance-list" + (view.prominentHint ? " sel-session-guidance-list--prominent" : "")
          }
        >
          {view.secondaries.map((sec) => (
            <li key={sec.id} className="sel-session-guidance-li">
              {sec.chunks.map((c, i) => renderChunk(c, `${sec.id}:${i}`))}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function renderTagRow(
  tag: PanelTag,
  index: number,
  opts: {
    multi: boolean;
    isFocus: boolean;
    onTagFocusRequest: (id: PanelTag["id"]) => void;
  },
): ReactElement {
  const { multi, isFocus, onTagFocusRequest } = opts;
  return (
    <li key={tag.id} className="sel-session-tag-row sel-session-tag-row--list-only">
      <span
        className={"sel-session-tag" + (isFocus ? " sel-session-tag--focus" : "")}
        data-focus={isFocus ? "1" : "0"}
        role={multi ? "button" : undefined}
        tabIndex={multi ? 0 : undefined}
        title={
          multi ? (isFocus ? "当前焦点项" : "点击设为焦点项") : undefined
        }
        aria-label={
          multi ? (isFocus ? `当前焦点：${tag.label}` : `设为焦点：${tag.label}`) : undefined
        }
        onClick={() => {
          if (multi) onTagFocusRequest(tag.id);
        }}
        onKeyDown={(e) => {
          if (multi && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onTagFocusRequest(tag.id);
          }
        }}
      >
        <span className="sel-session-tag-num">{index + 1}</span>
        <span className="sel-session-tag-label">
          {tag.label}
          {tag.hasAnnotation ? " *" : ""}
        </span>
      </span>
    </li>
  );
}

function FloatingSelectedList(props: {
  n: number;
  tags: PanelTag[];
  focusId: string | null;
  onTagFocusRequest: (id: PanelTag["id"]) => void;
}): ReactElement | null {
  const { n, tags, focusId, onTagFocusRequest } = props;
  if (n === 0) return null;
  return (
    <aside className="sel-session-floating-selected" aria-label="当前选中">
      {n === 1 ? (
        <ul className="sel-session-tree sel-session-tree--single" data-empty="0">
          {renderTagRow(tags[0]!, 0, {
            multi: false,
            isFocus: focusId != null && tags[0]!.id === focusId,
            onTagFocusRequest,
          })}
        </ul>
      ) : (
        <div className="sel-session-tree sel-session-tree--multi">
          <div className="sel-session-tree-virtual-root">
            <span className="sel-session-tree-virtual-glyph" aria-hidden>
              ◇
            </span>
            <span className="sel-session-tree-virtual-title">本页选取</span>
            <span className="sel-session-tree-virtual-count">共 {n} 项</span>
          </div>
          <ul className="sel-session-tree-children" aria-label="已选中的元素">
            {tags.map((tag, index) => {
              const isFocus = focusId != null && tag.id === focusId;
              return renderTagRow(tag, index, {
                multi: true,
                isFocus,
                onTagFocusRequest,
              });
            })}
          </ul>
        </div>
      )}
    </aside>
  );
}

export function SelectionSessionPanel(props: SelectionSessionPanelProps) {
  const paused = props.session.picking === "paused";
  const n = props.tags.length;
  const focusId = props.session.focusElementId ?? (n === 1 ? props.tags[0]?.id ?? null : null);
  const guidance = guidanceFromSession({
    session: props.session,
    userHasManualCopiedOnce: props.userHasManualCopiedOnce,
  });

  const rootClass =
    "sel-volt sel-session-panel" +
    (props.layout === "floating" ? " sel-session-panel--floating-strip" : " sel-session-panel--sandbox");

  const strip = (
    <div className="sel-session-strip">
      <header className="sel-session-drag" data-sel-drag-handle>
        <div className="sel-session-title">
          <span className="sel-session-dot" data-paused={paused ? "1" : "0"} />
          <span className="sel-session-status">选取</span>
        </div>
        <div className="sel-session-actions">
          <button
            type="button"
            className="sel-session-icon-btn"
            onClick={props.onClose}
            title="关闭会话：清除页上选取并结束本次选取"
            aria-label="关闭会话：清除页上选取并结束本次选取"
          >
            {ICON_CLOSE}
          </button>
        </div>
      </header>

      <div className="sel-session-strip-body">
        <SessionGuidance view={guidance} />
        {props.toastMessage ? (
          <div className="sel-session-toast" role="status">
            {props.toastMessage}
          </div>
        ) : null}
      </div>
    </div>
  );

  if (props.layout === "floating") {
    return (
      <div className={rootClass}>
        <div className="sel-session-chrome">
          {n >= 1 ? (
            <FloatingSelectedList n={n} tags={props.tags} focusId={focusId} onTagFocusRequest={props.onTagFocusRequest} />
          ) : null}
          {strip}
        </div>
      </div>
    );
  }

  return (
    <div className={rootClass}>
      <div className="sel-session-chrome sel-session-chrome--sandbox">
        {n >= 1 ? (
          <FloatingSelectedList n={n} tags={props.tags} focusId={focusId} onTagFocusRequest={props.onTagFocusRequest} />
        ) : null}
        {strip}
      </div>
    </div>
  );
}
