export {};

declare global {
  interface Window {
    __selectorApp?: {
      destroy(): void;
      openTutorialFromMenu(): void;
    };
  }
}
