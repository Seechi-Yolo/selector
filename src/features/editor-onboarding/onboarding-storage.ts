/** 扩展级：任意 https/http 页一致，避免此前误用页面 localStorage 导致按站点重复弹窗。 */
const STORAGE_KEY = "selector.tutorialIntro.dismissed.v1" as const;
/** 历史键：任一页面上曾为 "1" 时迁移为扩展级已关闭。 */
const LEGACY_LOCAL_KEY = "selector.onboarding.first3.v1" as const;

function storageLocal(): chrome.storage.LocalStorageArea | null {
  try {
    if (typeof chrome === "undefined" || !chrome.storage?.local) return null;
    return chrome.storage.local;
  } catch {
    return null;
  }
}

export async function isFirstThreeOnboardingDone(): Promise<boolean> {
  const area = storageLocal();
  if (!area) return false;

  try {
    const got = await area.get(STORAGE_KEY);
    if (got[STORAGE_KEY] === true) return true;
  } catch {
    /* 读失败时不阻断首次引导（此前误 return true 会导致永远不弹窗） */
  }

  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem(LEGACY_LOCAL_KEY) === "1") {
      try {
        await area.set({ [STORAGE_KEY]: true });
      } catch {
        /* 迁移写失败则仍视为未在扩展级关闭，避免永久卡死 */
        return false;
      }
      try {
        localStorage.removeItem(LEGACY_LOCAL_KEY);
      } catch {
        /* ignore */
      }
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export async function markFirstThreeOnboardingDone(): Promise<void> {
  const area = storageLocal();
  if (!area) return;
  try {
    await area.set({ [STORAGE_KEY]: true });
    try {
      localStorage.removeItem(LEGACY_LOCAL_KEY);
    } catch {
      /* ignore */
    }
  } catch {
    /* ignore */
  }
}
