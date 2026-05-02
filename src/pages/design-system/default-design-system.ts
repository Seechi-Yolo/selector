/**
 * 扩展内「默认设计系统」：基于 `.cursor/skills/ui-design-system/DESIGN.md` 精简，
 * 仅保留与 Selector 扩展内页一致的暗色界面相关的颜色、字体与按钮规格；
 * 完整 nine-section 文档与营销向长文案不进入本页。
 */

export interface DesignSystemBlock {
  readonly id: string;
  readonly title: string;
  readonly intro: readonly string[];
  /** 安全内联 HTML，仅用于本页受控 demo */
  readonly demoHtml: string;
  readonly promptTitle: string;
  /** 供用户复制进「修改说明」或外部 AI 的短提示词片段（非整站 DESIGN.md 全文） */
  readonly promptSnippet: string;
}

export const DEFAULT_DESIGN_SYSTEM_BLOCKS: readonly DesignSystemBlock[] = [
  {
    id: "ds-colors",
    title: "颜色与表面",
    intro: [
      "暗色画布 + 单一翠绿强调，与本扩展 help-hub / 选取面板气质一致。以下为常用令牌与角色说明。",
    ],
    demoHtml: `
      <div class="ds-demo ds-demo-swatches">
        <div class="ds-swatch" data-token="abyss" title="页面底"><span class="ds-swatch-label">Abyss</span><code>#050507</code></div>
        <div class="ds-swatch" data-token="carbon" title="卡片/条"><span class="ds-swatch-label">Carbon</span><code>#101010</code></div>
        <div class="ds-swatch" data-token="border" title="描边"><span class="ds-swatch-label">Border</span><code>#3d3a39</code></div>
        <div class="ds-swatch" data-token="signal" title="强调"><span class="ds-swatch-label">Signal</span><code>#00d992</code></div>
        <div class="ds-swatch" data-token="snow" title="主文"><span class="ds-swatch-label">Snow</span><code>#f2f2f2</code></div>
        <div class="ds-swatch" data-token="steel" title="次文"><span class="ds-swatch-label">Steel</span><code>#8b949e</code></div>
      </div>`,
    promptTitle: "提示词片段 · 颜色层",
    promptSnippet: `【界面颜色 · VoltAgent 精简】
- 画布：近黑 #050507（Abyss），带极弱暖调，不用冷灰大平面。
- 容器表面：#101010（Carbon），比画布略抬一层。
- 边框/分割：暖炭灰 #3d3a39（Warm Charcoal），不用纯中性灰。
- 品牌强调：翠绿 #00d992（Signal），少量用于描边、焦点、关键 CTA 轮廓。
- 主正文：#f2f2f2（Snow）；次级说明：#8b949e（Steel）；需要更柔的副文可用 #b8b3b0（Parchment）。
- 原则：单一绿色能量源，避免彩虹色；阴影可用暖环境雾 rgba(92,88,85,0.2) 轻量外扩。`,
  },
  {
    id: "ds-type",
    title: "字体与层级",
    intro: [
      "标题走系统 UI 字体以保证首屏速度；正文与控件走 Inter；等宽片段走系统 mono。以下为缩略层级示意。",
    ],
    demoHtml: `
      <div class="ds-demo ds-demo-type">
        <p class="ds-type-display">Display 级标题（system-ui，偏紧行高）</p>
        <p class="ds-type-section">Section 标题（system-ui）</p>
        <p class="ds-type-body">Body / 按钮文案（Inter，16px 量级，行高约 1.5）</p>
        <p class="ds-type-caption">Caption / 元数据（14px 量级，Steel 色）</p>
        <pre class="ds-type-code"><code>npm run build  // mono，小字号代码</code></pre>
      </div>`,
    promptTitle: "提示词片段 · 字体层",
    promptSnippet: `【字体与排版 · VoltAgent 精简】
- 标题（Display/Section）：font-family 使用 system-ui 栈（-apple-system, Segoe UI, Roboto…），字重偏 400–600，大行可用略紧行高（约 1.0–1.15）与轻微负字距。
- 正文与 UI：Inter，ui-sans-serif 回退；正文约 16px / 行高 1.5 左右；导航或次要链接可略小（约 14px）。
- 代码与命令行：SFMono / Menlo / Consolas 等 monospace；行高略紧，与正文区分层级。
- 原则：字重梯度柔和（多 400–500，700 留给少数强调）；全大写仅配合较大字距用于 overline 标签类，不用于大标题。`,
  },
  {
    id: "ds-buttons",
    title: "按钮样式",
    intro: [
      "三种常用规格：幽灵描边、主强调（深底 + 翠绿字/轮廓）、加重容器式。与 DESIGN.md 第 4 节对齐但去掉站点专属营销描述。",
    ],
    demoHtml: `
      <div class="ds-demo ds-demo-buttons">
        <button type="button" class="ds-btn ds-btn-ghost">Ghost / Outline</button>
        <button type="button" class="ds-btn ds-btn-primary">Primary CTA</button>
        <button type="button" class="ds-btn ds-btn-contained">Tertiary 容器</button>
      </div>`,
    promptTitle: "提示词片段 · 按钮层",
    promptSnippet: `【按钮 · VoltAgent 精简】
1) Ghost / Outline：背景透明；文字 #ffffff；内边距约 12px 16px；1px solid #3d3a39 边框；圆角约 6px；hover 时背景略压暗（如 rgba(0,0,0,0.2)）；焦点可用淡绿 rgba(33,196,93,0.5) 外轮廓。
2) Primary（深色上的「通电」CTA）：背景 #101010；文字 #2fd6a1（Mint）；可无可见边框，用 mint 色 focus ring；hover 同样略压暗背景。
3) Tertiary / 容器按钮：背景 #101010；文字 #f2f2f2；内边距更厚（约 20px）；3px solid #3d3a39 边框；圆角约 8px，用于大块可点区域（如代码块旁操作）。
- 原则：默认交互首选 Ghost；真正主路径再用 Primary；避免彩虹渐变按钮。`,
  },
];

export const DESIGN_SYSTEM_PAGE_LEAD =
  "本页为 Selector 内置的「默认设计系统」参考：UI 与提示词拆开呈现。提示词片段刻意保持短小，可分别粘贴到「修改说明」或与选取结果一并交给 AI；不等同于完整 DESIGN.md。";
