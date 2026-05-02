---
name: prd-pm
description: >-
  Writes and audits product requirement documents for this repository: scope,
  acceptance, alignment with docs/roadmap.md and docs/product-requirements-documentation.
  Use when the user works on PRD, 产品需求文档, 验收标准, or milestone documentation alignment.
disable-model-invocation: true
---

# PRD 规划与审核

编写或审核 `docs/product-requirements-documentation/` 下 PRD 时按本文件执行。仅修改代码且不涉及需求文档时不必套用。

## PRD 正文规范

适用于 `docs/product-requirements-documentation/` 内各文件。`docs/roadmap.md` 中的里程碑交付与验收须与 PRD 里程碑编号一致。

1. 只写要交付的内容与用户可感知结果。排除项与范围外结论放在路线图研讨或会议纪要，不写入 PRD 正文。
2. 同一事实只写一处；句子和条目能短则短。
3. 每条验收对应可观察的完成态；少用否定句式统领整段需求。
4. 实现细节与键名以 `README.md`、`manifest.json` 与源码为准；PRD 不写具体存储键与模块路径。

第 1 至第 3 条未满足的文稿须修改后再通过审核。

## 先行阅读

- `docs/roadmap.md`
- `docs/product-requirements-documentation/tutorial-and-sandbox.md` 中「内容与素材」一节的主路径，须与教程及实际 UI 一致。
- 仓库根目录 `README.md`、`manifest.json` 与 `src/` 作为工程边界。

## 文档结构

新 PRD 放在 `docs/product-requirements-documentation/`，单文件单主题。推荐结构如下。

```markdown
# PRD：主题

**里程碑**：M 序号一行。事实口径：README、manifest 一行。

## 1. 要做什么

## 2. 用户可感知行为

## 3. 内容与素材
无则写无。

## 4. 验收

## 5. 与路线图
```

复杂需求可在 §1 或单独章节用 FR-001 等形式编号，验收条与之对应；不写「非目标」专节。

## 审核

- 目标与主路径可在约一分钟内讲清。
- 无排除项堆砌与同义反复。
- 每条 P0 有对应验收条；与 `docs/roadmap.md` 里程碑表及交付验收各节无编号或语义冲突。
- 明显不可行处已标待确认或已论证。

结论为通过、有条件通过或不通过。有条件通过须列出须补全的条目。

## 与 user-story-check 的分工

短用户故事可用 `user-story-check` 做轻量检查。正式 PRD 与里程碑对齐以本 skill 为准；可先经故事 skill 再按上文结构与规范落稿。
