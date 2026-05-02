# 使用教程：文案与结构

本文供扩展内教程标签页及图像素材维护使用。所述交互与仓库内当前 Selector 实现保持一致。

## 主路径与阅读顺序

1. 启动扩展：通过浏览器工具栏内扩展图标或快捷键。快捷键以 `manifest.json` 中 `commands` 定义为权威来源。
2. 右下角面板总览：状态指示、操作说明、复制入口、已选元素列表。
3. 页内选取：单击、按住 Shift 追加选取、拖拽框选。
4. 选中后的页面叠加层：实线轮廓、角点、元素标签、批注入口笔形控件。
5. 撰写单条元素说明：批注浮层、完成与清除操作。
6. 复制提示词：面板按钮与主键盘复制快捷键、复制成功后的短时视觉反馈。
7. 常用恢复操作：空格切换暂停与继续选取、撤销、清空选区、关闭扩展会话。

上述每一步在教程页中对应一张动图位。动图尚未录制时，统一引用占位资源 `assets/tutorial/placeholder.gif`。该路径已在 `manifest.json` 的 `web_accessible_resources` 中声明。

## 动图文件命名与步骤对应关系

动图文件采用下列语义化名称，与主路径及分节内容一一对应：`01-open-selector`、`02-panel-overview`、`03-status-pause`、`04-panel-chrome`、`05-shortcuts-hint`、`06-hover-highlight`、`07-click-shift-select`、`08-marquee-select`、`09-selection-overlay`、`10-annotate-popover`、`11-panel-tag-list`、`12-copy-prompt`、`13-arrow-navigate`、`14-esc-undo`。其中第五节与第十三节动图为可选素材。第十四节可与第十节至第十二节合并为一条动图以降低录制成本。

每张动图在正文中须配有简短说明与图注，以满足可读性与无障碍要求。

## 正文体例

每一节采用统一结构：标题；用一句话说明该节主题；列出二至四步操作说明；嵌入动图；必要时以单独一行汇总相关快捷键。

教程页采用单页纵向滚动布局。首屏可提供指向「启动扩展」「单击选取」「复制提示词」三节的锚点链接，便于快速走通主路径。

仓库根目录 README 保留快捷键对照表。教程页承担带图示的情境说明；页脚可提供返回 README 的链接。

## 与沙箱及扩展内页面的关系

教程页与沙箱页均为扩展包内静态 HTML 资源，与注入到普通网页中的内容脚本面板处于不同展示上下文。合一入口、标签页划分及构建方式见 [../prd/tutorial-and-sandbox.md](../prd/tutorial-and-sandbox.md) 与 [../engineering/extension.md](../engineering/extension.md)。
