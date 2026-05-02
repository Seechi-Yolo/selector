import shellCss from "../_shell/extension-page-shell.css?raw";
import sandboxPageCss from "./sandbox-page.css?raw";
import { installSelectorExtensionPageActionListener } from "../../shared/extension/install-selector-extension-page-action-listener";
import {
  createEditorPanelShellElement,
  EditorChromeTheme,
  paintShellSampleTags,
} from "../../shared/editor-chrome";
import { EMBEDDED_EDITOR_HOST_CLASS } from "../../shared/dom/constants";

function injectStyles(): void {
  const base = document.createElement("style");
  base.textContent = `${shellCss}\n${sandboxPageCss}`;
  document.head.appendChild(base);
  /** 与可会话主面板共用 `EditorChromeTheme`（`assets/editor.css`） */
  EditorChromeTheme.inject();
}

interface SandboxSectionConfig {
  readonly id: string;
  readonly title: string;
}

function createSandboxSection(config: SandboxSectionConfig): { root: HTMLElement; body: HTMLElement } {
  const { id, title } = config;
  const root = document.createElement("section");
  root.className = "sandbox-isle";
  root.id = id;

  const header = document.createElement("div");
  header.className = "sandbox-isle-header";
  const h = document.createElement("h3");
  h.className = "sandbox-isle-title";
  h.textContent = title;
  header.appendChild(h);
  root.appendChild(header);

  const body = document.createElement("div");
  body.className = "sandbox-isle-body";
  root.appendChild(body);

  return { root, body };
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
  rail.setAttribute("aria-label", "示例目录");

  const railInner = document.createElement("div");
  railInner.className = "tutorial-rail-inner";
  const railTitle = document.createElement("span");
  railTitle.className = "tutorial-rail-title";
  railTitle.textContent = "目录";
  railInner.appendChild(railTitle);

  const navItems: readonly { href: string; label: string }[] = [
    { href: "#sample-editor-panel", label: "主面板" },
    { href: "#sample-text", label: "文案与标题" },
    { href: "#sample-cards", label: "卡片与布局" },
    { href: "#sample-lists", label: "列表与链接" },
    { href: "#sample-form", label: "表单与按钮" },
    { href: "#sample-rich", label: "图文与代码" },
  ];
  navItems.forEach((item, i) => {
    const a = document.createElement("a");
    a.className = "tutorial-rail-link";
    a.href = item.href;
    const num = document.createElement("span");
    num.className = "tutorial-rail-num";
    num.textContent = String(i + 1);
    const span = document.createElement("span");
    span.textContent = item.label;
    a.append(num, span);
    railInner.appendChild(a);
  });
  rail.appendChild(railInner);

  const flow = document.createElement("div");
  flow.className = "tutorial-flow sandbox-main-flow";

  const lead = document.createElement("p");
  lead.className = "sandbox-page-lead";
  lead.textContent =
    "以下为不同样式的页面片段。请使用与在普通网页中相同的方式：点击扩展图标或快捷键打开 Selector，在右下角使用主面板，对本页元素进行选取、批注与复制。";
  flow.appendChild(lead);

  const secEditorPanel = createSandboxSection({ id: "sample-editor-panel", title: "主面板" });
  const panelIntro = document.createElement("p");
  panelIntro.className = "sandbox-prose sandbox-prose-muted";
  panelIntro.style.marginBottom = "14px";
  panelIntro.textContent =
    "以下仅为「主面板外观」静态展示：注入 EditorChromeTheme（assets/editor.css）与静态壳 DOM（shared/editor-chrome），无 EditorPanel 选取/复制等逻辑。工具栏打开 Selector 后挂载的是另一对象（可交互 EditorPanel），二者样式同源、职责分离。";
  const panelMount = document.createElement("div");
  panelMount.className = `sandbox-editor-panel-host ${EMBEDDED_EDITOR_HOST_CLASS}`;
  secEditorPanel.body.append(panelIntro, panelMount);

  const shellRoot = createEditorPanelShellElement({ layout: "sandbox", mode: "shell" });
  panelMount.appendChild(shellRoot);
  paintShellSampleTags(shellRoot, [
    { label: "示例条目 A", hasAnnotation: false },
    { label: "示例条目 B", hasAnnotation: true },
  ]);
  flow.appendChild(secEditorPanel.root);

  const secText = createSandboxSection({ id: "sample-text", title: "文案与标题" });
  secText.body.innerHTML = `
    <p class="sandbox-prose">这是一段正文，用于练习点选整段或其中一部分。同一区块内还有层级标题。</p>
    <h4 class="sandbox-heading-4">四级标题示例</h4>
    <p class="sandbox-prose sandbox-prose-muted">次要说明文字，颜色更浅，常作为补充提示。</p>
    <blockquote class="sandbox-quote">引用块：适合练习选中较宽的块级元素。</blockquote>
  `;
  flow.appendChild(secText.root);

  const secCards = createSandboxSection({ id: "sample-cards", title: "卡片与布局" });
  secCards.body.innerHTML = `
    <div class="sandbox-card-row">
      <article class="sandbox-card">
        <h4 class="sandbox-card-title">卡片 A</h4>
        <p class="sandbox-card-body">两列卡片栅格，可分别点选标题、正文或整张卡片。</p>
      </article>
      <article class="sandbox-card sandbox-card--accent">
        <h4 class="sandbox-card-title">卡片 B</h4>
        <p class="sandbox-card-body">强调色边框，便于区分层次。</p>
      </article>
    </div>
    <div class="sandbox-banner">通栏提示条：模拟站内公告或状态条。</div>
  `;
  flow.appendChild(secCards.root);

  const secLists = createSandboxSection({ id: "sample-lists", title: "列表与链接" });
  secLists.body.innerHTML = `
    <ul class="sandbox-list">
      <li>无序列表第一项</li>
      <li>无序列表第二项，内含 <a class="sandbox-inline-link" href="#sample-text">锚点链接</a></li>
      <li>无序列表第三项</li>
    </ul>
    <ol class="sandbox-list sandbox-list-ordered">
      <li>有序步骤一</li>
      <li>有序步骤二</li>
    </ol>
  `;
  flow.appendChild(secLists.root);

  const secForm = createSandboxSection({ id: "sample-form", title: "表单与按钮" });
  secForm.body.innerHTML = `
    <div class="sandbox-form-row">
      <label class="sandbox-label">标签</label>
      <input class="sandbox-input" type="text" readonly value="只读输入框（仍可被框选）" />
    </div>
    <div class="sandbox-form-row">
      <textarea class="sandbox-textarea" rows="2" readonly>多行文本区域示例</textarea>
    </div>
    <div class="sandbox-btn-row">
      <button type="button" class="sandbox-btn sandbox-btn-primary">主要按钮</button>
      <button type="button" class="sandbox-btn sandbox-btn-ghost">次要按钮</button>
    </div>
  `;
  flow.appendChild(secForm.root);

  const secRich = createSandboxSection({ id: "sample-rich", title: "图文与代码" });
  secRich.body.innerHTML = `
    <figure class="sandbox-figure">
      <div class="sandbox-figure-placeholder" aria-hidden="true"></div>
      <figcaption class="sandbox-figcaption">图注：练习选中说明文字或占位图区域。</figcaption>
    </figure>
    <pre class="sandbox-code"><code>// 代码块示例
function greet(name) {
  return "Hello, " + name;
}</code></pre>
  `;
  flow.appendChild(secRich.root);

  grid.append(rail, flow);
  shell.appendChild(grid);
  page.append(ambient, shell);
  document.body.appendChild(page);
}

installSelectorExtensionPageActionListener();
main();
