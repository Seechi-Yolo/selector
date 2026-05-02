import { NS } from "../dom/constants";

export class AnnotationPopover {
  private root: HTMLDivElement | null = null;

  show(params: {
    id: string;
    anchor: HTMLElement;
    value: string;
    onSave(value: string): void;
    onClear(): void;
  }): void {
    this.remove();

    const popover = document.createElement("div");
    popover.className = `${NS}-root ${NS}-annotate-popover`;

    const textarea = document.createElement("textarea");
    textarea.className = `${NS}-annotate-input`;
    textarea.value = params.value;
    textarea.placeholder = "Instruction for this element...";
    textarea.rows = 2;

    const actions = document.createElement("div");
    actions.className = `${NS}-annotate-actions`;

    const clearButton = document.createElement("button");
    clearButton.className = `${NS}-annotate-clear`;
    clearButton.textContent = "Clear";

    const doneButton = document.createElement("button");
    doneButton.className = `${NS}-annotate-done`;
    doneButton.textContent = "Done";

    const save = () => {
      params.onSave(textarea.value);
      this.remove();
    };

    doneButton.onclick = (event) => {
      event.stopPropagation();
      save();
    };
    clearButton.onclick = (event) => {
      event.stopPropagation();
      params.onClear();
      this.remove();
    };
    textarea.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        save();
      }
      event.stopPropagation();
    });
    textarea.addEventListener("click", (event) => event.stopPropagation());

    actions.appendChild(clearButton);
    actions.appendChild(doneButton);
    popover.appendChild(textarea);
    popover.appendChild(actions);

    const rect = params.anchor.getBoundingClientRect();
    popover.style.top = `${rect.bottom + 6}px`;
    popover.style.right = `${Math.max(8, window.innerWidth - rect.right)}px`;

    document.body.appendChild(popover);
    this.root = popover;
    textarea.focus();
  }

  remove(): void {
    this.root?.remove();
    this.root = null;
  }

  get isOpen(): boolean {
    return Boolean(this.root);
  }
}
