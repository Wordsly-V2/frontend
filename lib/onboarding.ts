import {
    getLocalStorageItem,
    setLocalStorageItem,
} from "@/lib/local-storage";

/** Local flag: once set, the onboarding wizard never auto-shows again. */
export const ONBOARDING_DONE_KEY = "wordsly:onboarding-done";

export function isOnboardingDone(): boolean {
    return getLocalStorageItem(ONBOARDING_DONE_KEY) === "true";
}

export function markOnboardingDone(): void {
    setLocalStorageItem(ONBOARDING_DONE_KEY, "true");
}
