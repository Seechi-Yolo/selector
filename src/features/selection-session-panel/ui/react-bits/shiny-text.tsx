/**
 * 灵感来自 React Bits（https://reactbits.dev/）ShinyText：渐变扫光标题，无 Tailwind、无 motion 依赖。
 * MIT 风格组件集为参考实现，非官方包安装。
 */
import type { CSSProperties } from "react";

export interface ShinyTextProps {
  text: string;
  className?: string;
  /** 低速扫光，符合 design system「动画克制」 */
  durationSec?: number;
}

export function ShinyText({ text, className = "", durationSec = 5.5 }: ShinyTextProps) {
  const style: CSSProperties = {
    animationDuration: `${durationSec}s`,
  };
  return (
    <span className={`sel-shiny-text ${className}`.trim()} style={style}>
      {text}
    </span>
  );
}
