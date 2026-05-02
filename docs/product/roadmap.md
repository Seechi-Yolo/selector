# 路线图

## 里程碑

| # | 状态 | 名称 | 说明 |
|---|:---:|------|------|
| 1 | 已完成 | 重构与浏览器扩展 | 领域驱动设计拆分与 Manifest V3 扩展，行为与仓库根目录 README 一致 |
| 2 | 待办 | 选取范围 | 在结构复杂的页面上稳定指向用户意图修改的区域 |
| 3 | 待办 | 设置与提示词模板 | 默认模板可编辑、导出段落可开关、支持多套模板 |
| 4 | 待办 | 样式与高级提示词 | 对照页面观感、在工具内试调样式、导出内容便于人工智能理解界面意图 |
| 5 | 待办 | 设计系统 | 与组织设计规范对齐或从规范中选用 |

远期方向为用户手工构建交互流图并生成提示词，不通过自动录制网站真实操作链路实现。

各里程碑的交付内容与验收条件见 [capability-backlog.md](./capability-backlog.md)。

## 工程阶段

| 阶段 | 状态 | 产出 |
|------|:---:|------|
| A | 已完成 | 领域分层、可注入页面的脚本包，行为与 README 一致 |
| B | 已完成 | 清单文件、图标、dist 目录侧载、扩展动作唤起选取 |
| C | 进行中 | 自里程碑二起按版本迭代功能 |

依赖关系如下。里程碑一对应工程阶段 A 与 B，均已完成。里程碑四与五依赖里程碑二的选取稳定性。里程碑三可与里程碑二并行推进；提示词生成模块与模板模块的代码边界须在里程碑三大规模开发前完成划分。

## 文档同步

实现发生变更时，须同步更新 [product-goal.md](./product-goal.md)、[usage-tutorial.md](./usage-tutorial.md)（与教程、首次引导相关时）、[../engineering/architecture-ddd.md](../engineering/architecture-ddd.md)、[../engineering/extension.md](../engineering/extension.md) 与 [capability-backlog.md](./capability-backlog.md)。里程碑收口时须更新本索引文件 [../README.md](../README.md)。
