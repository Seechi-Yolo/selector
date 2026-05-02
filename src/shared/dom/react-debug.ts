interface ReactDebugInfo {
  source?: string;
  react?: string;
}

interface ReactFiber {
  _debugSource?: {
    fileName: string;
    lineNumber: number;
  };
  type?: {
    displayName?: string;
    name?: string;
  } | ((...args: never[]) => unknown);
  return?: ReactFiber | null;
}

const SKIP_REACT = new Set([
  "ClientPageRoot",
  "LinkComponent",
  "ServerComponent",
  "AppRouter",
  "Router",
  "HotReload",
  "ReactDevOverlay",
  "InnerLayoutRouter",
  "OuterLayoutRouter",
  "RedirectBoundary",
  "NotFoundBoundary",
  "ErrorBoundary",
  "LoadingBoundary",
  "TemplateContext",
  "ScrollAndFocusHandler",
  "RenderFromTemplateContext",
  "PathnameContextProviderAdapter",
  "Hot",
  "Inner",
  "Forward",
  "Root",
]);

function isUserComponent(name: string | undefined): name is string {
  if (!name || name.length < 2) return false;
  if (SKIP_REACT.has(name)) return false;
  if (/^[a-z]/.test(name)) return false;
  if (name.startsWith("_")) return false;
  return true;
}

function componentName(fiber: ReactFiber): string | undefined {
  if (typeof fiber.type === "function") return fiber.type.name;
  return fiber.type?.displayName ?? fiber.type?.name;
}

export function getReactDebug(el: Element): ReactDebugInfo {
  try {
    const fiberKey = Object.keys(el).find(
      (key) => key.startsWith("__reactFiber") || key.startsWith("__reactInternalInstance"),
    );
    if (!fiberKey) return {};

    const result: ReactDebugInfo = {};
    const firstFiber = (el as unknown as Record<string, ReactFiber | undefined>)[fiberKey];
    let walker = firstFiber;

    while (walker) {
      if (walker._debugSource) {
        const source = walker._debugSource;
        const file = source.fileName.replace(/^.*?\/src\//, "src/");
        result.source = `${file}:${source.lineNumber}`;
        break;
      }
      walker = walker.return ?? undefined;
    }

    const components: string[] = [];
    walker = firstFiber;
    while (walker) {
      const name = componentName(walker);
      if (isUserComponent(name) && !components.includes(name)) {
        components.push(name);
        if (components.length >= 3) break;
      }
      walker = walker.return ?? undefined;
    }

    if (components.length) result.react = components.reverse().join(" > ");
    return result;
  } catch {
    return {};
  }
}
