/** 前三步引导：打开扩展、面板总览、Selecting / Paused 与空格（与 docs/user-tutorial.md 对齐） */
export interface OnboardingStepCopy {
  title: string;
  body: string;
  imageAlt: string;
}

export const FIRST_THREE_STEPS: readonly OnboardingStepCopy[] = [
  {
    title: "如何打开 Selector",
    body: "在浏览器工具栏点击 Selector 图标，或使用快捷键 Alt+Shift+S。你能看到本说明和右下角面板，说明已经成功进入选取模式。",
    imageAlt: "演示：从工具栏或快捷键打开扩展",
  },
  {
    title: "认识右下角面板",
    body: "下方主面板可以拖动标题栏移动位置。这里有状态指示、快捷键提示、已选元素列表和「Copy Prompt」按钮。下面动图为占位，你之后可替换为录屏。",
    imageAlt: "演示：面板区域总览",
  },
  {
    title: "选取与暂停（Selecting / Paused）",
    body: "绿点与「Selecting」表示正在选取：移动鼠标会在页面上看到虚线高亮。按键盘空格进入「Paused」，灰点表示已暂停，此时不再跟随鼠标高亮，方便你正常点击页面；再按一次空格恢复选取。",
    imageAlt: "演示：空格切换 Selecting 与 Paused",
  },
];
