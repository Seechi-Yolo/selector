---
name: prd-pm
description: >-
  Plans and audits product requirement documents (PRD) from a product-manager
  lens: problem, users, scope, milestones, acceptance criteria, risks, and
  AI-implementation alignment. Use when writing or revising a PRD, 产品需求文档,
  需求规格, milestone scope, 验收标准, or when the user asks to align docs with
  phased delivery or agent implementation.
disable-model-invocation: true
---

# PRD 产品视角（规划与审核）

以**产品经理**视角做三件事：**澄清**（问题与价值）、**规划**（范围与阶段）、**审核**（可验收、可对齐实现）。输出要能直接指导工程拆分，并与 AI 协作时减少歧义。

## 何时读取本 skill

用户明确要做 PRD、审 PRD、拆阶段需求、或要把「文档 ↔ 实现」对齐时，按本文件执行。若用户只要改代码、未涉及需求文档，不必套用全文。

## 与本仓库对齐的必读上下文

动手写或审 PRD 前，先读（或让用户指明当前有效版本）：

- `docs/product/roadmap.md`、`docs/product/capability-backlog.md`：里程碑编号与阶段目标须一致；新需求归入对应里程碑或标为「待归档」。
- `docs/engineering/architecture-ddd.md`、`docs/engineering/extension.md`（若涉及扩展/运行时）：约束技术边界，PRD 不写与架构冲突的假设。
- 已有用户向文档（如 `docs/user/user-tutorial.md`）：用户故事与主路径须一致。

若仓库尚无正式 PRD，本 skill 负责**从上述文档抽象**出首版 PRD 结构，而不是凭空发明里程碑。

---

## 一、规划流程（写 PRD 前）

按顺序完成；缺信息时在 PRD 中显式标为 **待确认**，并列出需谁拍板。

1. **问题与场景**：谁、在什么情境下、遇到什么问题；不做这个功能会怎样。
2. **目标与非目标**：本阶段要证明什么；明确写 **不做** 什么（防范围蠕变）。
3. **用户与优先级**：主用户 / 次要用户；P0/P1；若与里程碑冲突，以 `docs/product/capability-backlog.md` 为准并注明差异。
4. **主路径**：3～7 步关键操作（与教程、实际 UI 一致）；每步可观察的**结果**。
5. **验收**：每条验收对应可观察行为或数据，避免「体验更好」类不可测表述；复杂项拆成子验收。
6. **依赖与风险**：浏览器/API/权限/性能；缓解措施或降级方案。
7. **AI 对齐块**（见下文）：单独一节，便于实现与评审时引用。

## 二、建议 PRD 文档结构（模板）

新建 PRD 放在 `docs/prd/`（按能力拆文件，如 `tutorial-and-sandbox.md`）。正文建议包含：

```markdown
# [产品/能力名] PRD

## 元信息
- 状态：草稿 / 评审中 / 已定稿
- 负责人：
- 关联里程碑：Mx（与 `docs/product/roadmap.md`、`capability-backlog.md` 一致）
- 变更记录：日期 — 摘要

## 1. 背景与问题
## 2. 目标与非目标
## 3. 用户与场景
## 4. 范围与主路径
## 5. 功能需求（编号 FR-001…）
## 6. 非功能需求（性能、无障碍、安全等，编号 NFR-…）
## 7. 验收标准（与 FR/NFR 可追溯对应）
## 8. 指标与成功判据（若有）
## 9. 依赖、风险与开放问题
## 10. AI 与实现对齐
```

需求编号在全文保持稳定，便于 issue、commit、AI 对话引用同一 ID。

## 三、「AI 与实现对齐」专节（必写）

本节是连接 PRD 与编码/Agent 的核心，建议固定小节：

- **术语表**：产品词 ↔ 代码/模块里常用名（例如「指认」对应哪条用户路径、哪个 feature 目录）。
- **范围边界**：接口、存储、权限、支持/不支持的页面类型；与 `docs/engineering/extension.md` 等一致。
- **可测试断言**：每条 P0 验收至少一条「是/否」可判定陈述（便于写 checklist 或手工测）。
- **分阶段交付**：本 PRD 覆盖哪些里程碑子集；每阶段结束时的「可演示增量」。
- **与现有文档关系**：本 PRD 替代或补充 `docs/product/`、`docs/engineering/`、`docs/user/` 中哪些段落。

## 四、审核清单（审 PRD 时用）

对草稿逐项打勾或批注；不通过则标 **阻塞** 并指明缺哪一节。

**产品完整性**

- [ ] 问题与目标可在一分钟内讲清；非目标已写。
- [ ] 主路径步骤与 `docs/user/user-tutorial.md` 或实际产品无矛盾。
- [ ] 每条 P0 有对应验收；验收可执行、可判定。
- [ ] 里程碑引用与 `docs/product/roadmap.md`、`capability-backlog.md` 无编号或语义冲突。

**可实现性**

- [ ] 无隐含「全知」能力（读任意站、绕过同源等）除非已论证可行。
- [ ] 性能/体积/权限敏感点有说明或标为后续里程碑。
- [ ] 开放问题有责任人或决策截止条件。

**AI 协作友好**

- [ ] 术语表存在且与仓库目录/特性名可对上。
- [ ] FR/NFR 编号稳定，可被 issue 与对话引用。
- [ ] 「AI 与实现对齐」已填，不仅复述功能文案。

## 五、输出习惯

- 规划阶段：先给**大纲 + 开放问题**，再展开全文，避免一次灌入未验证假设。
- 审核阶段：按第四节输出 **通过 / 有条件通过 / 不通过**；阻塞项单独列表。
- 不替用户决定商业优先级；若信息不足，列出选项与取舍问题供决策。

---

## 六、与 `user-story-check` skill 的分工

若用户贴的是**短用户故事**、要轻量「检查与灵感」，可用 `user-story-check`。本 skill 面向**正式 PRD、里程碑对齐、实现与 AI 可追溯**；二者可同时用：先用故事 skill 打磨叙述，再用本 skill 落 PRD 结构与审核。
