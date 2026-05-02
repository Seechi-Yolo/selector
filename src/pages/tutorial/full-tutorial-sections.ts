/** 教程正文；与 docs/product/usage-tutorial.md 信息架构对齐，措辞面向最终用户 */
export interface TutorialSection {
  id: string;
  title: string;
  paragraphs: readonly string[];
}

export const FULL_TUTORIAL_SECTIONS: readonly TutorialSection[] = [
  {
    id: "open",
    title: "如何打开 Selector",
    paragraphs: [
      "在浏览器工具栏点击 Selector 图标，或使用快捷键 Alt+Shift+S（Windows / Linux 与 macOS 相同）。",
      "在任意普通网页上打开后，右下角会出现主面板；移动指针时可看到待选元素的虚线高亮。不同网站上的具体表现可能略有差异。",
    ],
  },
  {
    id: "panel",
    title: "认识右下角主面板",
    paragraphs: [
      "主面板可拖动标题栏移动。其中包含：当前状态（Selecting / Paused）、快捷键提示、已选元素列表、用于复制提示词的按钮（Copy Prompt），以及最小化与关闭。",
    ],
  },
  {
    id: "pause",
    title: "选取与暂停（空格）",
    paragraphs: [
      "界面显示 Selecting 与绿点时，可继续点选页面元素；按空格进入 Paused，指针不再触发选取高亮，便于正常点击页面上的链接或表单。再按一次空格即可回到 Selecting。",
    ],
  },
  {
    id: "select",
    title: "在页面上选取元素",
    paragraphs: [
      "单击选中当前指针下的元素；按住 Shift 再单击可追加多选。在空白区域按住拖动可进行框选。",
      "仅选中一个元素时，可用方向键在页面元素结构中向上、下、左、右移动选中目标。",
    ],
  },
  {
    id: "overlay",
    title: "选中效果与批注",
    paragraphs: [
      "选中后会出现实线轮廓、角点与标签；笔形按钮用于打开批注，可填写说明后确认或清除。",
    ],
  },
  {
    id: "copy",
    title: "复制提示词",
    paragraphs: [
      "选好元素并可选择是否为某项填写批注后，点击主面板上的 Copy Prompt；在已有选中项时，也可使用 Cmd+C（macOS）或 Ctrl+C（Windows / Linux）。复制成功时，按钮会短暂显示 Copied 等反馈文案。",
    ],
  },
  {
    id: "undo",
    title: "撤销与清空",
    paragraphs: [
      "使用 Cmd+Z 或 Ctrl+Z 可撤销最近一次对选区的修改。若批注窗口已打开，Esc 会先关闭批注；否则将清空当前选区。",
    ],
  },
];
