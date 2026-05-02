import { describe, expect, it } from "vitest";
import { buildPromptText, type PromptElementContext } from "./index";

/** PRD D-14：复制提示词线性串接时整体块在逐项列表前 */
describe("Composed prompt ordering (D-14)", () => {
  const el = (overrides: Partial<PromptElementContext>): PromptElementContext => ({
    id: "x",
    index: 1,
    label: ".a",
    selector: "body > .a",
    tag: "div",
    text: "",
    outerHTML: "<div class=a></div>",
    dataAttrs: {},
    ...overrides,
  });

  it("Given 有整体说明与逐项元素 When 构建 Then 整体块出现在元素块之前", () => {
    const text = buildPromptText({
      pagePath: "/p",
      elements: [el({ id: "1" })],
      annotations: {},
      selectionLevelInstruction: "统一改成暗色主题",
    });
    const idxPage = text.indexOf("Page:");
    const idxOverall = text.indexOf("对当前选取的说明:");
    const idxFirstEl = text.indexOf("1. .a");
    expect(idxPage).toBeGreaterThanOrEqual(0);
    expect(idxOverall).toBeGreaterThan(idxPage);
    expect(idxFirstEl).toBeGreaterThan(idxOverall);
    expect(text).toContain("统一改成暗色主题");
  });

  it("Given 无元素 When 构建 Then 返回空串（无可写主内容）", () => {
    expect(
      buildPromptText({
        pagePath: "/p",
        elements: [],
        annotations: {},
        selectionLevelInstruction: "only overall",
      }),
    ).toBe("");
  });
});
