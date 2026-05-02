import { useMemo, type ReactNode } from "react";
import type { SelectionSessionState } from "../../../entities/selection-session";
import type { PanelTag } from "../../editor-panel/panel-tag";
import { guidanceFromSession } from "../guidance-from-session";
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
  /** D-21 第一次点击移除后，对应标签上的待确认微动效 */
  removeArmedTagId: string | null;
  onMinimize(): void;
  onClose(): void;
  onRemove(id: PanelTag["id"]): void;
  onClear(): void;
  onTagFocusRequest(tagId: PanelTag["id"]): void;
  onInstructionSurfaceClose(): void;
  onFinalizeWholeSet(): void;
  onWholeSetDraftChange(text: string): void;
  onWholeSetDraftClear(): void;
  onPerItemDraftChange(elementId: string, text: string): void;
  onPerItemDraftClear(elementId: string): void;
}

export function SelectionSessionPanel(props: SelectionSessionPanelProps) {
  const guidance = useMemo(
    () =>
      guidanceFromSession({
        session: props.session,
        userHasManualCopiedOnce: props.userHasManualCopiedOnce,
      }),
    [props.session, props.userHasManualCopiedOnce],
  );

  const paused = props.session.picking === "paused";

  const rootClass =
    "sel-volt sel-session-panel" +
    (props.minimized ? " sel-session-minimized" : "") +
    (props.layout === "sandbox" ? " sel-session-panel--sandbox" : "");

  const focusId =
    props.session.focusElementId ?? (props.tags.length === 1 ? props.tags[0]?.id ?? null : null);

  const showInstructionShell = props.session.instructionOpen && props.tags.length > 0;
  const wholeLayer = props.session.activeLayer === "whole_set";
  const selectionLevel = props.session.drafts.selectionLevelBody;
  const perItemText =
    focusId != null ? (props.session.drafts.perItemBodies[focusId] ?? "") : "";

  const secondaryNodes: ReactNode[] = guidance.secondaries.map((s) => (
    <span key={s.id} className="sel-session-guidance-secondary-line">
      {s.text}
    </span>
  ));

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
            <p className="sel-session-empty-hint">暂无已选项</p>
          ) : null}
          <div className="sel-session-tags" data-empty={props.tags.length === 0 ? "1" : "0"}>
            {props.tags.map((tag, index) => {
              const isFocus = focusId != null && tag.id === focusId;
              const removePending = props.removeArmedTagId === tag.id;
              return (
                <span
                  key={tag.id}
                  className={"sel-session-tag" + (isFocus ? " sel-session-tag--focus" : "")}
                  data-focus={isFocus ? "1" : "0"}
                  role={props.tags.length > 1 ? "button" : undefined}
                  tabIndex={props.tags.length > 1 ? 0 : undefined}
                  onClick={() => {
                    if (props.tags.length > 1) props.onTagFocusRequest(tag.id);
                  }}
                  onKeyDown={(e) => {
                    if (props.tags.length > 1 && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      props.onTagFocusRequest(tag.id);
                    }
                  }}
                >
                  <span className="sel-session-tag-num">{index + 1}</span>
                  <span className="sel-session-tag-label">
                    {tag.label}
                    {tag.hasAnnotation ? " *" : ""}
                  </span>
                  <button
                    type="button"
                    className={
                      "sel-session-tag-x" + (removePending ? " sel-session-tag-x--pending" : "")
                    }
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
              );
            })}
            {props.tags.length > 0 ? (
              <button type="button" className="sel-session-clear" onClick={props.onClear}>
                清空选取
              </button>
            ) : null}
          </div>
        </section>

        {showInstructionShell ? (
          <section
            className="sel-session-instruction"
            aria-label="说明面板"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                props.onInstructionSurfaceClose();
              }
            }}
          >
            <div className="sel-session-instruction-head">
              {wholeLayer ? "对当前选取的说明" : "修改说明"}
            </div>
            <p className="sel-session-instruction-sub">
              {wholeLayer
                ? "本段作用于当前选取的全部项（多选主框范围）。"
                : focusId != null
                  ? `作用于列表中当前焦点项（与页上高亮一致）。`
                  : null}
            </p>
            {wholeLayer ? (
              <textarea
                className="sel-session-instruction-input"
                rows={4}
                value={selectionLevel}
                placeholder="在此输入对当前选取的说明…"
                aria-label="对当前选取的说明"
                onChange={(e) => props.onWholeSetDraftChange(e.target.value)}
              />
            ) : (
              <textarea
                className="sel-session-instruction-input"
                rows={4}
                value={perItemText}
                placeholder="在此输入修改说明…"
                aria-label="修改说明"
                disabled={focusId == null}
                onChange={(e) => {
                  if (focusId != null) props.onPerItemDraftChange(focusId, e.target.value);
                }}
              />
            )}
            <div className="sel-session-instruction-actions">
              {wholeLayer ? (
                <button type="button" className="sel-session-btn sel-session-btn--primary" onClick={props.onFinalizeWholeSet}>
                  完成
                </button>
              ) : (
                <button type="button" className="sel-session-btn sel-session-btn--primary" onClick={props.onInstructionSurfaceClose}>
                  完成
                </button>
              )}
              <button
                type="button"
                className="sel-session-btn sel-session-btn--ghost"
                onClick={() => {
                  if (wholeLayer) props.onWholeSetDraftClear();
                  else if (focusId != null) props.onPerItemDraftClear(focusId);
                }}
              >
                清除
              </button>
              <button type="button" className="sel-session-btn sel-session-btn--ghost" onClick={props.onInstructionSurfaceClose}>
                关闭
              </button>
            </div>
          </section>
        ) : null}

        <section className="sel-session-guidance" aria-label="操作引导">
          <p className="sel-session-guidance-primary">
            {guidance.primaryUseShiny ? (
              <ShinyText text={guidance.primaryText} durationSec={6} />
            ) : (
              guidance.primaryText
            )}
          </p>
          {secondaryNodes.length > 0 ? (
            <div className="sel-session-guidance-secondary">{secondaryNodes}</div>
          ) : null}
          {props.toastMessage ? <div className="sel-session-toast">{props.toastMessage}</div> : null}
        </section>
      </div>
    </div>
  );
}
