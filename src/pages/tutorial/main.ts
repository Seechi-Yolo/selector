import shellCss from "../_shell/extension-page-shell.css?raw";
import { FULL_TUTORIAL_SECTIONS } from "./full-tutorial-sections";
import { extensionAssetUrl } from "../../shared/extension/extension-asset-url";
import { installSelectorExtensionPageActionListener } from "../../shared/extension/install-selector-extension-page-action-listener";

function injectStyles(): void {
  const el = document.createElement("style");
  el.textContent = shellCss;
  document.head.appendChild(el);
}

function appendTutorialSection(
  container: HTMLElement,
  index: number,
  total: number,
  id: string,
  title: string,
  paragraphs: readonly string[],
): void {
  const section = document.createElement("section");
  section.className = "tutorial-section";
  section.id = id;

  const head = document.createElement("div");
  head.className = "tutorial-section-head";

  const idx = document.createElement("span");
  idx.className = "tutorial-section-index";
  idx.textContent = `${String(index).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

  const h2 = document.createElement("h2");
  h2.textContent = title;

  head.append(idx, h2);
  section.appendChild(head);

  for (const text of paragraphs) {
    const p = document.createElement("p");
    p.textContent = text;
    section.appendChild(p);
  }

  const placeholderSrc = extensionAssetUrl("assets/tutorial/placeholder.gif");
  if (placeholderSrc) {
    const figure = document.createElement("figure");
    figure.className = "tutorial-section-figure";
    const img = document.createElement("img");
    img.src = placeholderSrc;
    img.alt = `「${title}」示意（占位图）`;
    img.decoding = "async";
    img.loading = "lazy";
    const cap = document.createElement("figcaption");
    cap.textContent = "动图占位，正式版将替换为屏幕录制。";
    figure.append(img, cap);
    section.appendChild(figure);
  }

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
  rail.setAttribute("aria-label", "教程章节");

  const railInner = document.createElement("div");
  railInner.className = "tutorial-rail-inner";
  const railTitle = document.createElement("span");
  railTitle.className = "tutorial-rail-title";
  railTitle.textContent = "目录";
  railInner.appendChild(railTitle);

  const total = FULL_TUTORIAL_SECTIONS.length;
  FULL_TUTORIAL_SECTIONS.forEach((block, i) => {
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

  FULL_TUTORIAL_SECTIONS.forEach((block, i) => {
    appendTutorialSection(flow, i + 1, total, block.id, block.title, block.paragraphs);
  });

  grid.append(rail, flow);
  shell.appendChild(grid);

  page.append(ambient, shell);
  document.body.appendChild(page);
}

installSelectorExtensionPageActionListener();
main();
