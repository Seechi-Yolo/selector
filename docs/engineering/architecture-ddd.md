# 架构：领域驱动设计要点

阶段一已完成。本文所述限界上下文与分层与当前 `src/` 目录结构一致。后续功能在既有骨架上增量演进。领域逻辑与文档对象模型及浏览器扩展 API 解耦。

## 限界上下文

| 上下文 | 职责 |
|--------|------|
| Element Selection | 悬停高亮、单选与多选、框选、键盘导航、撤销 |
| Annotation | 与选中元素绑定的文字说明 |
| Prompt Composition | 将选中集合与标注合成为可复制文本；里程碑三起读取用户侧模板配置 |
| Editor Shell | 编辑器面板、快捷键与选取流程协调；首次使用引导位于 `features/editor-onboarding` |
| Bootstrap | 注入生命周期与激活入口；扩展内教程页与沙箱页为静态资源，与核心业务域解耦，详见 [extension.md](./extension.md) |

选取与标注由应用层编排。提示词合成层仅读取上述上下文产出的模型。

## 分层

自外向内依次为 Infrastructure 与 Presentation、Application、Domain。Domain 层不得引用 `window` 或 `document`。Ports 包括但不限于 `DomQuery`、`Clipboard`、`Scheduler`、里程碑三引入的 `PromptTemplateStore`。依赖方向由外层指向内层。

## 验收

模块间不得存在循环依赖。提示词合成路径中的纯函数逻辑须具备在不依赖浏览器文档对象模型条件下的可测试性。
