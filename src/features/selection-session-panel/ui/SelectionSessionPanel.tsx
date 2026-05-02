import { useMemo, useState, type ReactNode } from "react";
import type { SelectionSessionState } from "../../../entities/selection-session";
import type { PanelTag } from "../../editor-panel/panel-tag";
import { guidanceFromSession, type SessionGuidanceSecondary } from "../guidance-from-session";
import "./design-tokens.css";
import "./selection-session-panel.css";
import { ShinyText } from "./react-bits/shiny-text";

const ICON_MINIMIZE = (
  <svg width="9" height="3" viewBox="0 0 10 2" fill="none" aria-hidden>
    <line x1="0" y1="1" x2="10" y2="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ICON_EXPAND = (
  <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden>
    <path d="M1 7L5 3L9 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ICON_CLOSE = (
  <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden>
    <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/** 标题栏单键：左右尖角，切换「提示 / 当前选中」 */
const ICON_TAB_SWAP = (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
    <path d="M5 2L2 6L5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 2L10 6L7 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function renderGuidanceSecondaryLine(s: SessionGuidanceSecondary): ReactNode {
  return (
    <span key={s.id} className="sel-session-guidance-secondary-line">
      {s.chunks.map((c, i) =>
        c.kind === "kbd" ? (
          <kbd key={`${s.id}-${i}`} className="sel-session-kbd">
            {c.value}
          </kbd>
        ) : (
          <span key={`${s.id}-${i}`}>{c.value}</span>
        ),
      )}
    </span>
  );
}

export type SelectionSessionMainTab = "prompt" | "selected";

export interface SelectionSessionPanelProps {
  session: SelectionSessionState;
  tags: PanelTag[];
  minimized: boolean;
  layout: "floating" | "sandbox";
  toastMessage: string | null;
  userHasManualCopiedOnce: boolean;
  onMinimize(): void;
  onClose(): void;
  onTagFocusRequest(tagId: PanelTag["id"]): void;
}

export function SelectionSessionPanel(props: SelectionSessionPanelProps) {
  const [mainTab, setMainTab] = useState<SelectionSessionMainTab>("prompt");

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

  const secondaryNodes: ReactNode[] = guidance.secondaries.map((s) => renderGuidanceSecondaryLine(s));

  const cycleTab = () => {
    setMainTab((t) => (t === "prompt" ? "selected" : "prompt"));
  };

  return (
    <div className={rootClass}>
      <header className="sel-session-drag" data-sel-drag-handle>
        <div className="sel-session-title">
          <span className="sel-session-dot" data-paused={paused ? "1" : "0"} />
          <span className="sel-session-status">UI Prompt Builder</span>
        </div>
        <div className="sel-session-actions">
          {!props.minimized ? (
            <button
              type="button"
              className="sel-session-icon-btn sel-session-tab-swap-btn"
              onClick={(e) => {
                e.stopPropagation();
                cycleTab();
              }}
              title={
                mainTab === "prompt"
                  ? "切换到「当前选中」：查看已选列表，并可将某一项设为键盘焦点"
                  : "切换到「提示」：查看操作说明与快捷键提示"
              }
              aria-label={
                mainTab === "prompt"
                  ? "切换到「当前选中」：查看已选列表，并可将某一项设为键盘焦点"
                  : "切换到「提示」：查看操作说明与快捷键提示"
              }
            >
              {ICON_TAB_SWAP}
            </button>
          ) : null}
          <button
            type="button"
            className="sel-session-icon-btn"
            onClick={props.onMinimize}
            title={
              props.minimized
                ? "展开面板：恢复完整宽度与操作区，面板回到展开前位置附近"
                : "最小化面板：缩成右侧竖条，仍磁吸在页面右侧，可拖动调整上下位置"
            }
            aria-label={
              props.minimized
                ? "展开面板：恢复完整宽度与操作区，面板回到展开前位置附近"
                : "最小化面板：缩成右侧竖条，仍磁吸在页面右侧，可拖动调整上下位置"
            }
          >
            {props.minimized ? ICON_EXPAND : ICON_MINIMIZE}
          </button>
          <button
            type="button"
            className="sel-session-icon-btn"
            onClick={props.onClose}
            title="关闭会话：清除页上选取并结束本次选取，扩展面板将收起"
            aria-label="关闭会话：清除页上选取并结束本次选取，扩展面板将收起"
          >
            {ICON_CLOSE}
          </button>
        </div>
      </header>

      <div className="sel-session-body">
        {mainTab === "prompt" ? (
          <section
            className={
              "sel-session-guidance" +
              (guidance.prominentHint ? " sel-session-guidance--prominent-hint" : "")
            }
            aria-label="操作引导"
          >
            {guidance.primaryText.trim().length > 0 ? (
              <p className="sel-session-guidance-primary">
                {guidance.primaryUseShiny ? (
                  <ShinyText text={guidance.primaryText} durationSec={6} />
                ) : (
                  guidance.primaryText
                )}
              </p>
            ) : null}
            {secondaryNodes.length > 0 ? (
              <div className="sel-session-guidance-secondary">{secondaryNodes}</div>
            ) : null}
          </section>
        ) : (
          <div className="sel-session-selected-stack">
            <section className="sel-session-selected" aria-label="当前选中">
              {props.tags.length === 0 ? (
                <p className="sel-session-empty-hint">暂无已选项</p>
              ) : null}
              <div className="sel-session-tag-rows" data-empty={props.tags.length === 0 ? "1" : "0"}>
                {props.tags.map((tag, index) => {
                  const isFocus = focusId != null && tag.id === focusId;
                  return (
                    <div key={tag.id} className="sel-session-tag-row sel-session-tag-row--list-only">
                      <span
                        className={"sel-session-tag" + (isFocus ? " sel-session-tag--focus" : "")}
                        data-focus={isFocus ? "1" : "0"}
                        role={props.tags.length > 1 ? "button" : undefined}
                        tabIndex={props.tags.length > 1 ? 0 : undefined}
                        title={
                          props.tags.length > 1
                            ? isFocus
                              ? "当前焦点项：方向键以此项为锚点移动；Enter 可打开该项的修改说明"
                              : "点击设为焦点项：之后方向键与 Enter 修改说明均针对此项"
                            : undefined
                        }
                        aria-label={
                          props.tags.length > 1
                            ? isFocus
                              ? "当前焦点项：方向键以此项为锚点移动；Enter 可打开该项的修改说明"
                              : "点击设为焦点项：之后方向键与 Enter 修改说明均针对此项"
                            : undefined
                        }
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
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
        {props.toastMessage ? (
          <div className="sel-session-toast" role="status">
            {props.toastMessage}
          </div>
        ) : null}
      </div>
    </div>
  );
}
