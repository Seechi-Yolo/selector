import editorCss from "../../../assets/editor.css?raw";
import shellCss from "../_shell/extension-page-shell.css?raw";
import sandboxPageCss from "./sandbox-page.css?raw";
import { createStaticOnboardingCard, FIRST_THREE_STEPS } from "../../features/editor-onboarding";
import { assignElementIds, elementId } from "../../shared/dom/page-elements";
import { AnnotationPopover } from "../../shared/ui/annotation-popover";
import { EditorPanel } from "../../shared/ui/editor-panel";
import { SelectionOverlays } from "../../shared/ui/selection-overlays";

function injectStyles(): void {
  const el = document.createElement("style");
  el.textContent = `${editorCss}\n${shellCss}\n${sandboxPageCss}`;
  document.head.appendChild(el);
}

interface SandboxIsleConfig {
  readonly id: string;
  readonly title: string;
  readonly badge?: string;
}

interface SandboxIsle {
  readonly root: HTMLElement;
  readonly body: HTMLElement;
  readonly appendLog: (msg: string) => void;
}

function createSandboxIsle(config: SandboxIsleConfig): SandboxIsle {
  const { id, title, badge = "LIVE" } = config;

  const root = document.createElement("section");
  root.className = "sandbox-isle";
  root.id = id;

  const header = document.createElement("div");
  header.className = "sandbox-isle-header";

  const h = document.createElement("h3");
  h.className = "sandbox-isle-title";
  h.textContent = title;

  const badgeEl = document.createElement("span");
  badgeEl.className = "sandbox-isle-badge";
  badgeEl.textContent = badge;

  header.append(h, badgeEl);
  root.appendChild(header);

  const body = document.createElement("div");
  body.className = "sandbox-isle-body";
  root.appendChild(body);

  const logEl = document.createElement("pre");
  logEl.className = "sandbox-isle-log";
  logEl.textContent = "// 操作记录";
  root.appendChild(logEl);

  const appendLog = (msg: string): void => {
    logEl.textContent = `${logEl.textContent}\n${msg}`.trim();
  };

  return { root, body, appendLog };
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

  const hero = document.createElement("header");
  hero.className = "tutorial-hero";
  hero.innerHTML = `
    <p class="tutorial-hero-eyebrow">Selector · 试用环境</p>
    <h1>界面沙箱</h1>
    <p>在此可试用与网页中<strong>相同</strong>的主面板、批注与选取高亮，无需先打开任意网站。操作步骤与快捷键见「使用教程」。</p>
    <p class="sandbox-hero-sub">若你在修改扩展源码：保存后执行 <code>npm run build</code>（或使用项目的 watch 构建），在 Chrome 的 <code>chrome://extensions</code> 中重新加载本扩展，再刷新本页即可看到变更。</p>
    <div class="tutorial-hero-pills">
      <span class="tutorial-hero-pill tutorial-hero-pill--accent">界面与真实使用一致</span>
      <span class="tutorial-hero-pill">选取高亮覆盖在当前页之上</span>
      <span class="tutorial-hero-pill">详细说明见「使用教程」</span>
    </div>
  `;
  shell.appendChild(hero);

  const note = document.createElement("div");
  note.className = "tutorial-note";
  const p = document.createElement("p");
  p.innerHTML =
    "下方各区块相互独立，底部附有<strong>操作记录</strong>便于对照。选取时的高亮层叠在当前说明页之上，与在普通网页中使用时的层次关系一致。";
  note.appendChild(p);
  shell.appendChild(note);

  const docsGrid = document.createElement("div");
  docsGrid.className = "tutorial-docs-grid";

  const rail = document.createElement("nav");
  rail.className = "tutorial-rail";
  rail.setAttribute("aria-label", "沙箱区块");

  const railInner = document.createElement("div");
  railInner.className = "tutorial-rail-inner";
  const railTitle = document.createElement("span");
  railTitle.className = "tutorial-rail-title";
  railTitle.textContent = "目录";
  railInner.appendChild(railTitle);

  const navItems: readonly { href: string; label: string }[] = [
    { href: "#isle-editor", label: "主面板" },
    { href: "#isle-onboarding", label: "首次使用引导" },
    { href: "#isle-popover", label: "元素批注" },
    { href: "#isle-overlays", label: "选取与悬停高亮" },
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

  const region = document.createElement("div");
  region.className = "tutorial-flow";

  const secTitle = document.createElement("p");
  secTitle.className = "sandbox-section-title";
  secTitle.textContent = "分块试用";
  region.appendChild(secTitle);

  const intro = document.createElement("p");
  intro.className = "sandbox-lead";
  intro.textContent =
    "每一类界面单独放在一个区块中，可按顺序试用；若你关心样式或布局，可结合底部记录观察各操作的反馈。";
  region.appendChild(intro);

  const isleEditor = createSandboxIsle({
    id: "isle-editor",
    title: "主面板",
    badge: "交互",
  });
  region.appendChild(isleEditor.root);

  const panelSlot = document.createElement("div");
  isleEditor.body.appendChild(panelSlot);

  const panel = new EditorPanel(
    {
      onCopy: () => {
        panel.showCopyFeedback("Copied");
        isleEditor.appendLog("已触发复制提示词");
      },
      onClose: () => isleEditor.appendLog("已点击关闭（沙箱内仅记录，不移除面板）"),
      onRemove: (rid) => {
        isleEditor.appendLog(`已从列表移除：${rid}`);
      },
      onClear: () => {
        panel.renderTags([]);
        isleEditor.appendLog("已清空列表");
      },
      onMinimizeChange: (m) => isleEditor.appendLog(`最小化状态：${m}`),
    },
    { mount: panelSlot, layout: "sandbox" },
  );

  panel.renderTags([
    { id: "sandbox-demo-1", label: ".hero-title <h1>", hasAnnotation: true },
    { id: "sandbox-demo-2", label: ".sidebar <nav>", hasAnnotation: false },
  ]);

  const panelToolbar = document.createElement("div");
  panelToolbar.className = "tutorial-playground-toolbar";
  const btnPause = document.createElement("button");
  btnPause.type = "button";
  btnPause.textContent = "切换选取中 / 已暂停";
  let paused = false;
  btnPause.addEventListener("click", () => {
    paused = !paused;
    panel.setPaused(paused);
    isleEditor.appendLog(`状态已设为：${paused ? "已暂停" : "选取中"}`);
  });
  panelToolbar.appendChild(btnPause);
  isleEditor.body.appendChild(panelToolbar);

  const isleOnboarding = createSandboxIsle({
    id: "isle-onboarding",
    title: "首次使用引导（静态示意）",
    badge: "展示",
  });
  region.appendChild(isleOnboarding.root);

  const onboardingGrid = document.createElement("div");
  onboardingGrid.className = "tutorial-onboarding-grid";
  FIRST_THREE_STEPS.forEach((step, index) => {
    onboardingGrid.appendChild(createStaticOnboardingCard(step, index + 1, FIRST_THREE_STEPS.length));
  });
  isleOnboarding.body.appendChild(onboardingGrid);
  isleOnboarding.appendLog("本区为静态示意，不产生交互记录。");

  const islePopover = createSandboxIsle({
    id: "isle-popover",
    title: "元素批注",
    badge: "交互",
  });
  region.appendChild(islePopover.root);

  const popToolbar = document.createElement("div");
  popToolbar.className = "tutorial-playground-toolbar";
  const popover = new AnnotationPopover();
  const popBtn = document.createElement("button");
  popBtn.type = "button";
  popBtn.className = "tutorial-anchor-btn";
  popBtn.textContent = "打开批注";
  popBtn.addEventListener("click", () => {
    popover.show({
      id: "sandbox-popover-demo",
      anchor: popBtn,
      value: "可在此输入批注示例文字",
      onSave: (v) => islePopover.appendLog(`已保存批注（前 80 字）：${v.slice(0, 80)}`),
      onClear: () => islePopover.appendLog("已清除批注"),
    });
  });
  popToolbar.appendChild(popBtn);
  islePopover.body.appendChild(popToolbar);

  const isleOverlays = createSandboxIsle({
    id: "isle-overlays",
    title: "选取与悬停高亮",
    badge: "交互",
  });
  region.appendChild(isleOverlays.root);

  const playground = document.createElement("div");
  playground.className = "tutorial-playground";

  const toolbar = document.createElement("div");
  toolbar.className = "tutorial-playground-toolbar";
  const btnHover = document.createElement("button");
  btnHover.type = "button";
  btnHover.textContent = "开启悬停高亮";
  const btnSelect = document.createElement("button");
  btnSelect.type = "button";
  btnSelect.textContent = "选中示例区域甲";
  const btnClear = document.createElement("button");
  btnClear.type = "button";
  btnClear.textContent = "清除高亮与选中";
  toolbar.appendChild(btnHover);
  toolbar.appendChild(btnSelect);
  toolbar.appendChild(btnClear);
  playground.appendChild(toolbar);

  const blockA = document.createElement("div");
  blockA.className = "tutorial-demo-block";
  blockA.textContent = "示例区域甲";
  const blockB = document.createElement("div");
  blockB.className = "tutorial-demo-block";
  blockB.textContent = "示例区域乙";
  playground.appendChild(blockA);
  playground.appendChild(blockB);
  isleOverlays.body.appendChild(playground);

  assignElementIds(playground);
  const idA = elementId(blockA);

  const makeOverlays = (): SelectionOverlays =>
    new SelectionOverlays((rid, button) => {
      popover.show({
        id: rid,
        anchor: button,
        value: "",
        onSave: () => isleOverlays.appendLog(`已保存批注：${rid}`),
        onClear: () => isleOverlays.appendLog(`已清除批注：${rid}`),
      });
    });

  let overlays = makeOverlays();

  let hoverOn = false;
  btnHover.addEventListener("click", () => {
    hoverOn = !hoverOn;
    btnHover.textContent = hoverOn ? "关闭悬停高亮" : "开启悬停高亮";
    if (hoverOn) overlays.createHoverBox();
    else overlays.showHover(null, () => false);
    isleOverlays.appendLog(`悬停高亮：${hoverOn ? "开" : "关"}`);
  });

  playground.addEventListener(
    "mousemove",
    (event) => {
      if (!hoverOn) return;
      const t = event.target;
      if (!(t instanceof Element) || !playground.contains(t)) {
        overlays.showHover(null, () => false);
        return;
      }
      if (t === playground || t === toolbar) {
        overlays.showHover(null, () => false);
        return;
      }
      overlays.showHover(t, () => false);
    },
    true,
  );

  btnSelect.addEventListener("click", () => {
    overlays.createHoverBox();
    overlays.render([idA], () => true);
    isleOverlays.appendLog("已显示对「示例区域甲」的选中高亮");
  });

  btnClear.addEventListener("click", () => {
    hoverOn = false;
    btnHover.textContent = "开启悬停高亮";
    overlays.destroy();
    overlays = makeOverlays();
    isleOverlays.appendLog("已重置选取与高亮状态");
  });

  docsGrid.append(rail, region);
  shell.appendChild(docsGrid);
  page.append(ambient, shell);
  document.body.appendChild(page);
}

main();
