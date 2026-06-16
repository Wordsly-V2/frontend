/**
 * First-run onboarding state. localStorage-backed (mirrors lib/learning-session.ts).
 * Goal also persists server-side via useUpdateDailyGoalMutation; level is local-only metadata.
 */
export const ONBOARDING_STORAGE_KEY = "wordsly.onboarding";

export const ONBOARDING_LEVELS = ["A2", "B1", "B2", "C1"] as const;
export type OnboardingLevel = (typeof ONBOARDING_LEVELS)[number];

export type OnboardingState = {
    completed: boolean;
    goal?: number;
    level?: OnboardingLevel;
};

const EMPTY: OnboardingState = { completed: false };

export function getOnboardingState(): OnboardingState {
    if (globalThis.window === undefined) return EMPTY;
    try {
        const raw = globalThis.localStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (!raw) return EMPTY;
        const parsed = JSON.parse(raw) as Partial<OnboardingState>;
        return { completed: !!parsed.completed, goal: parsed.goal, level: parsed.level };
    } catch {
        return EMPTY;
    }
}

function write(state: OnboardingState): void {
    if (globalThis.window === undefined) return;
    try {
        globalThis.localStorage.setItem(
            ONBOARDING_STORAGE_KEY,
            JSON.stringify(state),
        );
    } catch {
        // ignore
    }
}

export function patchOnboarding(patch: Partial<OnboardingState>): void {
    write({ ...getOnboardingState(), ...patch });
}

export function completeOnboarding(patch?: Partial<OnboardingState>): void {
    write({ ...getOnboardingState(), ...patch, completed: true });
}

export function isOnboardingComplete(): boolean {
    return getOnboardingState().completed;
}
