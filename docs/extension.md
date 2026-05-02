# 浏览器扩展

**✅ 阶段一**：MV3、`manifest.json`、content script 注入与 `dist/` 侧载路径已实现；具体字段与构建步骤以仓库根 `manifest.json`、`README.md` 为准。

## 运行时

MV3：`manifest.json`、图标。主逻辑在 **content script**；CSS 随扩展注入或 `css` 引用。**Service worker** 处理 `action` / `commands` / 按需 `scripting`；领域逻辑放在共享模块，由 content script 执行。

## 权限

最小化：`activeTab` 或窄 `host_permissions` 等，以实现与审核为准。

## 产物与分发

默认可 **加载已解压的扩展** 的目录（如 `dist/`）。可选书签 bundle，与扩展同源构建。网站可提供构建说明、包下载、商店链接。

## 验收

Chromium 侧载后，在 HTTPS 与常见本地页上，选取、标注、复制与 README 可见行为一致。
