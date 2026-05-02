# 浏览器扩展

阶段一已完成。扩展基于 Manifest V3。清单字段、权限声明与本地构建步骤以仓库根目录 `manifest.json` 及 `README.md` 为权威说明。

运行时方面，主要业务逻辑运行于内容脚本。样式表随扩展包注入。服务工作线程处理浏览器动作、命令接口以及按需触发的脚本注入 API。领域逻辑置于共享模块，由内容脚本载入执行。

首次教程引导弹窗与选取 UI 均在主内容脚本 `assets/content.js` 注入后挂载；清单**不**注册自动运行的 `content_scripts`，避免用户仅浏览页面即被打扰。用户通过工具栏扩展图标或快捷键触发后，由服务工作线程 `scripting.executeScript` 注入 `assets/content.js`。

权限集合遵循最小够用原则，具体枚举以 `manifest.json` 为准，并须满足实现目标与商店审核要求。其中 `storage` 用于跨站点记录教程引导是否已关闭（`chrome.storage.local`）。从内容脚本打开教程顶栏页须通过 `runtime.sendMessage` 由服务工作线程调用 `chrome.tabs.create`，勿在网页上下文中对 `chrome-extension://` 使用 `window.open`，否则易被客户端拦截（如 ERR_BLOCKED_BY_CLIENT）。

默认分发形态为对 `dist/` 目录执行加载未打包扩展的安装方式。

## 扩展内页：教程与沙箱

完整构建由 `npm run build` 串联：`vite.config.ts`（服务工作线程）、`vite.config.content.ts`（主内容脚本须为无顶层 `import` 的 IIFE 单文件，供 `executeScript` 注入）、再执行 `vite.tutorial.config.ts` 生成扩展内页。本地开发须使用 `make dev` 或 `npm run dev`，其实现见 `scripts/extension-watch.mjs`（对上述配置并行 watch）。不得单独对主 Vite 配置长期开启仅含主体产物的 watch 模式，否则 `dist/src/pages/` 下教程与沙箱产物将缺失或损坏。

| 页面 | 源码路径 | 构建产物 HTML 路径 |
|------|----------|-------------------|
| 教程与沙箱顶栏 | `src/pages/help-hub/help-hub.html` | `dist/src/pages/help-hub/help-hub.html` |
| 教程正文 | `src/pages/tutorial/tutorial.html` | `dist/src/pages/tutorial/tutorial.html` |
| 沙箱 | `src/pages/sandbox/sandbox.html` | `dist/src/pages/sandbox/sandbox.html` |

扩展图标右键菜单仅含一项「使用教程与沙箱」，打开顶栏页；默认展示「使用教程」标签，内嵌教程 HTML；「沙箱」标签内嵌沙箱 HTML。教程与沙箱页面仍可通过 `chrome.runtime.getURL` 单独打开，用于开发与书签场景。

页面通过 `chrome.runtime.getURL` 解析为扩展内 URL 后打开。教程页与沙箱页共用壳层样式文件 `src/pages/_shell/extension-page-shell.css`。顶栏页样式位于 `src/pages/help-hub/help-hub.css`。

扩展上下文菜单与双标签页行为以 [../prd/tutorial-and-sandbox.md](../prd/tutorial-and-sandbox.md) 为准。教程正文结构与资源命名须与 [../product/usage-tutorial.md](../product/usage-tutorial.md) 一致。

## 验收

在 Chromium 系浏览器中完成侧载后，于 HTTPS 与常见本地开发页面上，选取、标注与复制行为须与仓库根目录 README 所载一致。
