const STORAGE_KEY = "selector.onboarding.first3.v1";

export function isFirstThreeOnboardingDone(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markFirstThreeOnboardingDone(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}
