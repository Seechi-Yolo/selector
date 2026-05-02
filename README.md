# Selector

Point at any element. Tell your AI what to change.

Selector is a local-first Chrome MV3 extension that lets you visually select elements on any web page, add instructions, and copy a structured prompt for Claude Code, Codex, Cursor, or any AI coding assistant.

## Install for development

```bash
npm install
npm run build
```

`make build` is equivalent to `npm run build` (TypeScript + Vite for the service worker, one IIFE content bundle for the editor, then extension pages). **`make dev` / `npm run dev`** runs a full build once, then watches the service worker, the content script bundle, and the tutorial bundle so `dist/src/pages/**` (tutorial, sandbox, help-hub) is not wiped while the main bundles are watching.

Then open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select `dist/`.

## Usage

Open any web page and click the **Selector** extension action. You can also use `Alt+Shift+S`.

| Action | What it does |
|---|---|
| **Click** | Select an element |
| **Shift + Click** | Add to selection |
| **Drag** | Marquee (range) select multiple elements |
| **↑ / ↓** | Navigate to parent / child element |
| **← / →** | Navigate to previous / next sibling |
| **Edit instruction** (bottom-right on each selection outline) | Open the instruction surface: per-item **修改说明**; with multi-select before the whole-set step, the **union** outline shows **整段说明** for **对当前选取的说明** (same paths as **Enter**) |
| **⌘/Ctrl + C** | Copy the composed **复制提示词** to the clipboard (same text as auto-sync) |
| **⌘/Ctrl + Z** | Undo the last selection / annotation change |
| **Space** | Pause / resume picking |
| **Esc** | Close instruction first when open; otherwise clear selection（见 `docs/product-requirements-documentation/selection-session-interaction-and-state.md` **I-11**） |

The composed **复制提示词** includes page path, element metadata (tag, selector, text, React component info where available), optional **对当前选取的说明**, and per-element **修改说明** where present. Changes debounce-auto-copy to the clipboard when there is writable content.

## Example output

```
Page: /dashboard

对当前选取的说明:
统一使用暗色侧栏样式

1. .hero-title <h1>
   selector: body > main > section > h1
   source: src/components/Hero.tsx:12
   react: Layout › Hero
   text: "Welcome to the Dashboard"
   html: <h1 class="hero-title">Welcome to the Dashboard</h1>
   修改说明: Make this red and larger

2. .sidebar <nav>
   selector: body > aside > nav
   text: "Home Settings Profile Logout"
   html: <nav class="sidebar">…
   修改说明: Add an "Analytics" link after "Settings"
```

## How it works

The extension injects a content script into the active tab after a user action. Everything runs client-side in the browser. No selected content, annotations, prompts, or page metadata are uploaded.

## Development

```bash
git clone https://github.com/oil-oil/selector.git
cd selector
npm install
npm run build
```

## License

MIT
