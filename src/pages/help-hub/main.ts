import helpHubCss from "./help-hub.css?raw";

const TUTORIAL_PATH = "src/pages/tutorial/tutorial.html";
const SANDBOX_PATH = "src/pages/sandbox/sandbox.html";
const DESIGN_SYSTEM_PATH = "src/pages/design-system/design-system.html";

function injectDocumentStyles(css: string): void {
  const el = document.createElement("style");
  el.textContent = css;
  document.head.appendChild(el);
}

type HelpHubTab = "tutorial" | "sandbox" | "design";

function main(): void {
  injectDocumentStyles(helpHubCss);

  const root = document.createElement("div");
  root.className = "help-hub-root";

  const ambient = document.createElement("div");
  ambient.className = "help-hub-ambient";
  ambient.setAttribute("aria-hidden", "true");
  root.appendChild(ambient);

  const top = document.createElement("div");
  top.className = "help-hub-top";

  const bar = document.createElement("div");
  bar.className = "help-hub-bar";

  const barStart = document.createElement("div");
  barStart.className = "help-hub-bar-start";

  const brand = document.createElement("div");
  brand.className = "help-hub-brand";
  const mark = document.createElement("img");
  mark.className = "help-hub-brand-mark";
  mark.src = chrome.runtime.getURL("icons/selector-icon.svg");
  mark.alt = "";
  mark.width = 22;
  mark.height = 22;
  mark.setAttribute("aria-hidden", "true");
  const title = document.createElement("h1");
  title.className = "help-hub-brand-title";
  title.textContent = "Selector";
  const sub = document.createElement("span");
  sub.className = "help-hub-brand-sub";
  sub.textContent = "使用教程、沙箱与设计系统";
  brand.append(mark, title, sub);
  barStart.appendChild(brand);

  const barCenter = document.createElement("div");
  barCenter.className = "help-hub-bar-center";

  const tablist = document.createElement("div");
  tablist.className = "help-hub-tabs";
  tablist.setAttribute("role", "tablist");
  tablist.setAttribute("aria-label", "教程、沙箱与设计系统");

  const tabTutorial = document.createElement("button");
  tabTutorial.type = "button";
  tabTutorial.className = "help-hub-tab";
  tabTutorial.setAttribute("role", "tab");
  tabTutorial.id = "help-hub-tab-tutorial";
  tabTutorial.setAttribute("aria-controls", "help-hub-panel-tutorial");
  tabTutorial.setAttribute("aria-selected", "true");
  tabTutorial.textContent = "使用教程";

  const tabSandbox = document.createElement("button");
  tabSandbox.type = "button";
  tabSandbox.className = "help-hub-tab";
  tabSandbox.setAttribute("role", "tab");
  tabSandbox.id = "help-hub-tab-sandbox";
  tabSandbox.setAttribute("aria-controls", "help-hub-panel-sandbox");
  tabSandbox.setAttribute("aria-selected", "false");
  tabSandbox.textContent = "沙箱";

  const tabDesign = document.createElement("button");
  tabDesign.type = "button";
  tabDesign.className = "help-hub-tab";
  tabDesign.setAttribute("role", "tab");
  tabDesign.id = "help-hub-tab-design";
  tabDesign.setAttribute("aria-controls", "help-hub-panel-design");
  tabDesign.setAttribute("aria-selected", "false");
  tabDesign.textContent = "设计系统";

  tablist.append(tabTutorial, tabSandbox, tabDesign);
  barCenter.appendChild(tablist);

  const barEnd = document.createElement("div");
  barEnd.className = "help-hub-bar-end";
  barEnd.setAttribute("aria-hidden", "true");

  bar.append(barStart, barCenter, barEnd);
  top.appendChild(bar);
  root.appendChild(top);

  const panels = document.createElement("div");
  panels.className = "help-hub-panels";

  const iframeTutorial = document.createElement("iframe");
  iframeTutorial.className = "help-hub-frame help-hub-frame-visible";
  iframeTutorial.id = "help-hub-panel-tutorial";
  iframeTutorial.title = "使用教程";
  iframeTutorial.setAttribute("role", "tabpanel");
  iframeTutorial.setAttribute("aria-labelledby", "help-hub-tab-tutorial");
  iframeTutorial.src = chrome.runtime.getURL(TUTORIAL_PATH);

  const iframeSandbox = document.createElement("iframe");
  iframeSandbox.className = "help-hub-frame";
  iframeSandbox.id = "help-hub-panel-sandbox";
  iframeSandbox.title = "沙箱";
  iframeSandbox.setAttribute("role", "tabpanel");
  iframeSandbox.setAttribute("aria-labelledby", "help-hub-tab-sandbox");

  const iframeDesign = document.createElement("iframe");
  iframeDesign.className = "help-hub-frame";
  iframeDesign.id = "help-hub-panel-design";
  iframeDesign.title = "设计系统";
  iframeDesign.setAttribute("role", "tabpanel");
  iframeDesign.setAttribute("aria-labelledby", "help-hub-tab-design");

  panels.append(iframeTutorial, iframeSandbox, iframeDesign);
  root.appendChild(panels);
  document.body.appendChild(root);

  const selectTab = (which: HelpHubTab): void => {
    const isTutorial = which === "tutorial";
    const isSandbox = which === "sandbox";
    const isDesign = which === "design";
    tabTutorial.setAttribute("aria-selected", String(isTutorial));
    tabSandbox.setAttribute("aria-selected", String(isSandbox));
    tabDesign.setAttribute("aria-selected", String(isDesign));
    iframeTutorial.classList.toggle("help-hub-frame-visible", isTutorial);
    iframeSandbox.classList.toggle("help-hub-frame-visible", isSandbox);
    iframeDesign.classList.toggle("help-hub-frame-visible", isDesign);
    if (isSandbox && !iframeSandbox.src) {
      iframeSandbox.src = chrome.runtime.getURL(SANDBOX_PATH);
    }
    if (isDesign && !iframeDesign.src) {
      iframeDesign.src = chrome.runtime.getURL(DESIGN_SYSTEM_PATH);
    }
  };

  tabTutorial.addEventListener("click", () => selectTab("tutorial"));
  tabSandbox.addEventListener("click", () => selectTab("sandbox"));
  tabDesign.addEventListener("click", () => selectTab("design"));

  const hash = window.location.hash.replace(/^#/, "").toLowerCase();
  if (hash === "sandbox") {
    selectTab("sandbox");
  } else if (hash === "design" || hash === "design-system") {
    selectTab("design");
  }
}

main();
