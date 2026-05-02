import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import type { SelectionSessionState } from "../../../entities/selection-session";
import type { PanelTag } from "../../editor-panel/panel-tag";
import "./design-tokens.css";
import "./selection-session-panel.css";

const FLOATING_PANEL_SIZE_KEY = "selector.floatingPanelSize";
const MIN_PANEL_W = 100;
const MIN_PANEL_H = 136;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

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

export interface SelectionSessionPanelProps {
  session: SelectionSessionState;
  tags: PanelTag[];
  minimized: boolean;
  layout: "floating" | "sandbox";
  toastMessage: string | null;
  onMinimize(): void;
  onClose(): void;
  onTagFocusRequest(tagId: PanelTag["id"]): void;
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
          multi
            ? isFocus
              ? "当前焦点项"
              : "点击设为焦点项"
            : undefined
        }
        aria-label={
          multi
            ? isFocus
              ? `当前焦点：${tag.label}`
              : `设为焦点：${tag.label}`
            : undefined
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

export function SelectionSessionPanel(props: SelectionSessionPanelProps) {
  const paused = props.session.picking === "paused";
  const n = props.tags.length;
  const panelRef = useRef<HTMLDivElement>(null);
  const [customSize, setCustomSize] = useState<{ w: number; h: number } | null>(null);
  const resizeSession = useRef<{
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    maxW: number;
    maxH: number;
    pointerId: number;
    gripEl: HTMLElement;
  } | null>(null);

  useEffect(() => {
    if (props.layout !== "floating") return;
    try {
      const raw = localStorage.getItem(FLOATING_PANEL_SIZE_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as { w?: unknown; h?: unknown };
      if (typeof p.w !== "number" || typeof p.h !== "number") return;
      const w = Math.round(p.w);
      const h = Math.round(p.h);
      if (w >= MIN_PANEL_W && h >= MIN_PANEL_H && w <= 4000 && h <= 4000) {
        setCustomSize({ w, h });
      }
    } catch {
      /* ignore */
    }
  }, [props.layout]);

  const onResizePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (props.layout !== "floating" || props.minimized) return;
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const panel = panelRef.current;
      const grip = e.currentTarget;
      if (!panel) return;

      const rect = panel.getBoundingClientRect();
      const w0 = Math.round(rect.width);
      const h0 = Math.round(rect.height);
      setCustomSize({ w: w0, h: h0 });

      const margin = 16;
      resizeSession.current = {
        startX: e.clientX,
        startY: e.clientY,
        startW: w0,
        startH: h0,
        maxW: window.innerWidth - margin,
        maxH: window.innerHeight - margin,
        pointerId: e.pointerId,
        gripEl: grip,
      };
      grip.setPointerCapture(e.pointerId);

      const onMove = (ev: globalThis.PointerEvent) => {
        const s = resizeSession.current;
        if (!s || ev.pointerId !== s.pointerId) return;
        const dw = ev.clientX - s.startX;
        const dh = ev.clientY - s.startY;
        const w = clamp(s.startW + dw, MIN_PANEL_W, s.maxW);
        const h = clamp(s.startH + dh, MIN_PANEL_H, s.maxH);
        setCustomSize({ w, h });
      };

      const onUp = (ev: globalThis.PointerEvent) => {
        const s = resizeSession.current;
        if (!s || ev.pointerId !== s.pointerId) return;
        try {
          s.gripEl.releasePointerCapture(ev.pointerId);
        } catch {
          /* already released */
        }
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        resizeSession.current = null;
        setCustomSize((prev) => {
          if (prev) {
            try {
              localStorage.setItem(FLOATING_PANEL_SIZE_KEY, JSON.stringify(prev));
            } catch {
              /* quota / private */
            }
          }
          return prev;
        });
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [props.layout, props.minimized],
  );

  const rootClass =
    "sel-volt sel-session-panel" +
    (props.minimized ? " sel-session-minimized" : "") +
    (props.layout === "sandbox" ? " sel-session-panel--sandbox" : "");

  const focusId =
    props.session.focusElementId ?? (n === 1 ? props.tags[0]?.id ?? null : null);

  const floatingSizedStyle: CSSProperties | undefined =
    props.layout === "floating" && !props.minimized && customSize
      ? {
          width: customSize.w,
          height: customSize.h,
          aspectRatio: "auto",
          maxWidth: "none",
        }
      : undefined;

  return (
    <div ref={panelRef} className={rootClass} style={floatingSizedStyle}>
      <header className="sel-session-drag" data-sel-drag-handle>
        <div className="sel-session-title">
          <span className="sel-session-dot" data-paused={paused ? "1" : "0"} />
          <span className="sel-session-status">已选中</span>
        </div>
        <div className="sel-session-actions">
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
        <div className="sel-session-selected-stack">
          <section className="sel-session-selected" aria-label="已选列表">
            {n === 0 ? <p className="sel-session-empty-hint">暂无已选项</p> : null}

            {n === 1 ? (
              <ul className="sel-session-tree sel-session-tree--single" data-empty="0">
                {renderTagRow(props.tags[0]!, 0, {
                  multi: false,
                  isFocus: focusId != null && props.tags[0]!.id === focusId,
                  onTagFocusRequest: props.onTagFocusRequest,
                })}
              </ul>
            ) : null}

            {n >= 2 ? (
              <div className="sel-session-tree sel-session-tree--multi">
                <div className="sel-session-tree-virtual-root">
                  <span className="sel-session-tree-virtual-glyph" aria-hidden>
                    ◇
                  </span>
                  <span className="sel-session-tree-virtual-title">本页选取</span>
                  <span className="sel-session-tree-virtual-count">共 {n} 项</span>
                </div>
                <ul className="sel-session-tree-children" aria-label="已选中的元素">
                  {props.tags.map((tag, index) => {
                    const isFocus = focusId != null && tag.id === focusId;
                    return renderTagRow(tag, index, {
                      multi: true,
                      isFocus,
                      onTagFocusRequest: props.onTagFocusRequest,
                    });
                  })}
                </ul>
              </div>
            ) : null}
          </section>
        </div>
        {props.toastMessage ? (
          <div className="sel-session-toast" role="status">
            {props.toastMessage}
          </div>
        ) : null}
      </div>

      {props.layout === "floating" && !props.minimized ? (
        <div
          className="sel-session-resize-grip"
          data-sel-resize-grip
          onPointerDown={onResizePointerDown}
          role="separator"
          aria-orientation="horizontal"
          aria-label="拖动右下角调整面板宽高"
          title="拖动调整大小"
        />
      ) : null}
    </div>
  );
}
