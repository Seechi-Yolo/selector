import shellCss from "../_shell/extension-page-shell.css?raw";
import { DEFAULT_DESIGN_SYSTEM_BLOCKS, DESIGN_SYSTEM_PAGE_LEAD } from "./default-design-system";
import designPageCss from "./design-system-page.css?raw";
import { installSelectorExtensionPageActionListener } from "../../shared/extension/install-selector-extension-page-action-listener";

function injectStyles(): void {
  const el = document.createElement("style");
  el.textContent = `${shellCss}\n${designPageCss}`;
  document.head.appendChild(el);
}

function appendBlock(
  container: HTMLElement,
  index: number,
  total: number,
  block: (typeof DEFAULT_DESIGN_SYSTEM_BLOCKS)[number],
): void {
  const section = document.createElement("section");
  section.className = "tutorial-section";
  section.id = block.id;

  const head = document.createElement("div");
  head.className = "tutorial-section-head";

  const idx = document.createElement("span");
  idx.className = "tutorial-section-index";
  idx.textContent = `${String(index).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

  const h2 = document.createElement("h2");
  h2.textContent = block.title;
  head.append(idx, h2);
  section.appendChild(head);

  for (const text of block.intro) {
    const wrap = document.createElement("div");
    wrap.className = "ds-block-intro";
    const p = document.createElement("p");
    p.textContent = text;
    wrap.appendChild(p);
    section.appendChild(wrap);
  }

  const demoHost = document.createElement("div");
  demoHost.className = "ds-block";
  demoHost.innerHTML = block.demoHtml;
  section.appendChild(demoHost);

  const promptCard = document.createElement("div");
  promptCard.className = "ds-prompt-card";

  const ph = document.createElement("h3");
  ph.textContent = block.promptTitle;

  const pre = document.createElement("pre");
  pre.className = "ds-prompt-pre";
  pre.textContent = block.promptSnippet;

  const row = document.createElement("div");
  row.className = "ds-copy-row";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "ds-copy-btn";
  btn.textContent = "复制片段";
  btn.setAttribute("data-copy-text", block.promptSnippet);

  const hint = document.createElement("span");
  hint.className = "ds-copy-hint";
  hint.textContent = "写入剪贴板，可与选取会话中的说明组合使用。";

  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(block.promptSnippet);
      hint.textContent = "已复制。";
      hint.dataset.state = "copied";
      window.setTimeout(() => {
        hint.textContent = "写入剪贴板，可与选取会话中的说明组合使用。";
        delete hint.dataset.state;
      }, 2000);
    } catch {
      hint.textContent = "复制失败，请手动选择上方文本。";
    }
  });

  row.append(btn, hint);
  promptCard.append(ph, pre, row);
  section.appendChild(promptCard);

  container.appendChild(section);
}

function main(): void {
  injectStyles();

  const page = document.createElement("div");
  page.className = "ext-page";

  const ambient = document.createElement("div");
  ambient.className = "ext-ambient";
  ambient.setAttribute("aria-hidden", "true");

  const shell = document.createElement("div");
  shell.className = "tutorial-shell";

  const grid = document.createElement("div");
  grid.className = "tutorial-docs-grid";

  const rail = document.createElement("nav");
  rail.className = "tutorial-rail";
  rail.setAttribute("aria-label", "设计系统章节");

  const railInner = document.createElement("div");
  railInner.className = "tutorial-rail-inner";
  const railTitle = document.createElement("span");
  railTitle.className = "tutorial-rail-title";
  railTitle.textContent = "目录";
  railInner.appendChild(railTitle);

  const total = DEFAULT_DESIGN_SYSTEM_BLOCKS.length;
  DEFAULT_DESIGN_SYSTEM_BLOCKS.forEach((block, i) => {
    const a = document.createElement("a");
    a.className = "tutorial-rail-link";
    a.href = `#${block.id}`;
    const num = document.createElement("span");
    num.className = "tutorial-rail-num";
    num.textContent = String(i + 1);
    const span = document.createElement("span");
    span.textContent = block.title;
    a.append(num, span);
    railInner.appendChild(a);
  });
  rail.appendChild(railInner);

  const flow = document.createElement("div");
  flow.className = "tutorial-flow";

  const lead = document.createElement("p");
  lead.className = "ds-page-lead";
  lead.textContent = DESIGN_SYSTEM_PAGE_LEAD;
  flow.appendChild(lead);

  DEFAULT_DESIGN_SYSTEM_BLOCKS.forEach((block, i) => {
    appendBlock(flow, i + 1, total, block);
  });

  grid.append(rail, flow);
  shell.appendChild(grid);
  page.append(ambient, shell);
  document.body.appendChild(page);
}

installSelectorExtensionPageActionListener();
main();
