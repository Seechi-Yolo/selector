# 浏览器扩展

阶段一已完成。扩展基于 Manifest V3。清单字段、权限声明与本地构建步骤以仓库根目录 `manifest.json` 及 `README.md` 为权威说明。

运行时方面，主要业务逻辑运行于内容脚本。样式表随扩展包注入。服务工作线程处理浏览器动作、命令接口以及按需触发的脚本注入 API。领域逻辑置于共享模块，由内容脚本载入执行。

权限集合遵循最小够用原则，具体枚举以 `manifest.json` 为准，并须满足实现目标与商店审核要求。

默认分发形态为对 `dist/` 目录执行加载未打包扩展的安装方式。

## 扩展内页：教程与沙箱

完整构建流程在主体产物生成之后执行 `vite.tutorial.config.ts`，避免清空或覆盖内容脚本注入所需的构建结果。本地开发须使用 `make dev` 或 `npm run dev`，其实现见 `scripts/extension-watch.mjs`。不得单独对主 Vite 配置长期开启仅含主体产物的 watch 模式，否则 `dist/src/pages/` 下教程与沙箱产物将缺失或损坏。

| 页面 | 源码路径 | 构建产物 HTML 路径 |
|------|----------|-------------------|
| 教程 | `src/pages/tutorial/tutorial.html` | `dist/src/pages/tutorial/tutorial.html` |
| 沙箱 | `src/pages/sandbox/sandbox.html` | `dist/src/pages/sandbox/sandbox.html` |

页面通过 `chrome.runtime.getURL` 解析为扩展内 URL 后打开。扩展内页面共用壳层样式文件 `src/pages/_shell/extension-page-shell.css`。

扩展上下文菜单、教程与沙箱合一入口及双标签页行为以 [../prd/tutorial-and-sandbox.md](../prd/tutorial-and-sandbox.md) 为准。教程正文结构与资源命名须与 [../user/user-tutorial.md](../user/user-tutorial.md) 一致。

## 验收

在 Chromium 系浏览器中完成侧载后，于 HTTPS 与常见本地开发页面上，选取、标注与复制行为须与仓库根目录 README 所载一致。
