# 架构（DDD 要点）

**✅ 阶段一**：下列限界上下文与分层已与当前 `src/` 目录结构对齐；后续里程碑在此骨架上增量演进。

领域与 DOM、扩展 API 解耦。

## 限界上下文

| 上下文 | 职责 |
|--------|------|
| Element Selection | 悬停、点选/多选、框选、键盘导航、撤销 |
| Annotation | 与选中项绑定的说明 |
| Prompt Composition | 选中 + 标注 → 可复制文本；**消费用户模板配置**（里程碑 3） |
| Editor Shell | 面板、快捷键、与选取流程协调；首访三步引导见 `features/editor-onboarding`（纯 UI + `localStorage` 门闩，由应用层挂载） |
| Bootstrap | 注入生命周期；与 content script / 激活入口对齐（见 [extension.md](./extension.md)） |

选取与标注由应用层编排；提示词层只读其模型。

## 分层

Domain（无 `window`/`document`）→ Application（用例）→ Ports（`DomQuery`、`Clipboard`、`Scheduler`、**`PromptTemplateStore`** 等）→ Infrastructure / Presentation。

依赖由外向内。

## 验收

无循环依赖；巨石单文件不再是唯一形态；Prompt 纯逻辑可脱离 DOM 测（若团队启用）。
