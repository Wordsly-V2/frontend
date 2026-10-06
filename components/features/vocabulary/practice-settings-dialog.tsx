"use client";

import {
    forwardRef,
    useImperativeHandle,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { usePracticeSettings } from "@/hooks/usePracticeSettings.hook";
import { useDueWordsLimit, setDueWordsLimit } from "@/hooks/useDueWordsLimit.hook";
import { useNewWordsLimit, setNewWordsLimit } from "@/hooks/useNewWordsLimit.hook";
import {
    MIXED_PRACTICE_MODES,
    SELECTABLE_MIXED_PRACTICE_MODES,
    type MixedPracticeMethod,
    type PracticeMode,
    type PracticeSettings,
} from "@/lib/practice-settings";
import {
    DUE_WORDS_LIMIT_OPTIONS,
    NEW_WORDS_LIMIT_OPTIONS,
} from "@/lib/due-words-limit";
import {
    useDailyHabitDisplay,
    useUpdateDailyGoalMutation,
} from "@/queries/daily-habit.query";
import {
    useGetLearningSettingsQuery,
    useUpdateLearningSettingsMutation,
} from "@/queries/learning-settings.query";
import { DAILY_GOAL_OPTIONS } from "@/types/daily-habit/daily-habit.type";
import {
    DAILY_NEW_WORD_LIMIT_OPTIONS,
    DAILY_REVIEW_LIMIT_OPTIONS,
} from "@/types/learning-settings/learning-settings.type";
import { getPracticeModeMeta } from "@/lib/practice-mode-meta";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    Blocks,
    CheckCheck,
    Mic,
    Sparkles,
    Volume2,
    MessageSquare,
    LayoutGrid,
    Shuffle,
    TextCursorInput,
    Bell,
    ListOrdered,
    Target,
    Sunrise,
    RefreshCw,
    type LucideIcon,
} from "lucide-react";

// Re-exported from lib/practice-settings (their canonical home) so existing
// imports from this component keep working.
export type { PracticeMode, PracticeSettings };

interface PracticeSettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    /**
     * When true, also surface session-scope prefs (words per session, daily
     * goal) so the dialog works as a pre-practice setup hub on the Learn page.
     * Left off inside a running session — those aren't meaningful mid-session.
     */
    includeSessionPrefs?: boolean;
}

/** Imperative handle so the form's single Save button can commit session prefs. */
interface SessionPrefsHandle {
    commit: () => void;
}

function PracticeSettingsForm({
    currentSettings,
    onSave,
    onClose,
    includeSessionPrefs = false,
}: Readonly<{
    currentSettings: PracticeSettings;
    onSave: (settings: PracticeSettings) => void;
    onClose: () => void;
    includeSessionPrefs?: boolean;
}>) {
    const sessionPrefsRef = useRef<SessionPrefsHandle>(null);
    const [tempMode, setTempMode] = useState(currentSettings.mode);
    const [tempMixedModes, setTempMixedModes] = useState<MixedPracticeMethod[]>(
        currentSettings.mixedModes.length > 0
            ? currentSettings.mixedModes
            : [...MIXED_PRACTICE_MODES],
    );
    const [tempAutoCheck, setTempAutoCheck] = useState(currentSettings.autoCheck);
    const [tempSoundEnabled, setTempSoundEnabled] = useState(currentSettings.soundEnabled);

    // Preserve the canonical mix order so the plan rotates predictably.
    const toggleMixedMode = (method: MixedPracticeMethod) => {
        setTempMixedModes((prev) => {
            const next = prev.includes(method)
                ? prev.filter((m) => m !== method)
                : SELECTABLE_MIXED_PRACTICE_MODES.filter(
                      (m) => m === method || prev.includes(m),
                  );
            // Never allow an empty mix — keep at least the last selected method.
            return next.length > 0 ? next : prev;
        });
    };

    const handleSave = () => {
        onSave({
            mode: tempMode,
            mixedModes: tempMixedModes,
            autoCheck: tempAutoCheck,
            soundEnabled: tempSoundEnabled,
        });
        if (includeSessionPrefs) sessionPrefsRef.current?.commit();
        onClose();
    };

    const isMixed = tempMode === "mixed";
    const supportsAutoCheck =
        isMixed ||
        tempMode === "listening" ||
        tempMode === "context" ||
        tempMode === "word-bank" ||
        tempMode === "cloze" ||
        tempMode === "sentence-build";

    const modes: { id: PracticeMode; icon: typeof Sparkles; label: string; desc: string }[] = [
        { id: "mixed", icon: Shuffle, label: "Mixed", desc: "Best for memory" },
        { id: "listening", icon: Volume2, label: "Listening", desc: "Listen and type" },
        { id: "context", icon: MessageSquare, label: "In context", desc: "Type the word in a sentence" },
        { id: "cloze", icon: TextCursorInput, label: "Fill-in", desc: "Pick the word in context" },
        { id: "word-bank", icon: LayoutGrid, label: "Word bank", desc: "Pick the word for a meaning" },
        { id: "sentence-build", icon: Blocks, label: "Build", desc: "Put the words in order" },
        { id: "speaking", icon: Mic, label: "Speaking", desc: "Say the word out loud" },
        { id: "flashcard", icon: Sparkles, label: "Flashcard", desc: "Reveal and rate" },
    ];

    return (
        <>
            <DialogHeader className="shrink-0 px-6 pb-4 pt-6">
                <DialogTitle>Practice settings</DialogTitle>
                <DialogDescription>Choose how your exercises work.</DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-6 pb-6">
                <SettingsSection title="Exercise type">
                    <div className="grid grid-cols-2 gap-2">
                        {modes.map(({ id, icon: Icon, label, desc }) => {
                            const selected = tempMode === id;
                            return (
                                <button
                                    key={id}
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() => setTempMode(id)}
                                    className={cn(
                                        "flex min-h-[4.5rem] items-start gap-2.5 rounded-2xl border-2 p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                        selected
                                            ? "border-primary bg-primary/10 dark:bg-primary/15"
                                            : "border-border/70 hover:border-primary/40 hover:bg-muted/50",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                                            selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                                        )}
                                    >
                                        <Icon className="h-4 w-4" aria-hidden />
                                    </span>
                                    <span className="min-w-0">
                                        <span className={cn("block text-sm font-bold leading-tight", selected && "text-primary")}>
                                            {label}
                                        </span>
                                        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{desc}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    {isMixed && (
                        <div className="mt-4 rounded-2xl bg-muted/50 p-3">
                            <p className="mb-2.5 text-xs text-muted-foreground">
                                Choose which methods to mix. Speaking uses your microphone, so it stays off until you turn it on.
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {SELECTABLE_MIXED_PRACTICE_MODES.map((method) => {
                                    const meta = getPracticeModeMeta(method);
                                    const MethodIcon = meta.icon;
                                    const selected = tempMixedModes.includes(method);
                                    return (
                                        <button
                                            key={method}
                                            type="button"
                                            aria-pressed={selected}
                                            onClick={() => toggleMixedMode(method)}
                                            className={cn(
                                                "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                                selected
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-border bg-background text-muted-foreground hover:bg-muted",
                                            )}
                                        >
                                            <MethodIcon className="h-3.5 w-3.5" aria-hidden />
                                            {meta.shortLabel}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </SettingsSection>

                <SettingsSection title="While you practice">
                    <SettingsList>
                        <SettingRow
                            htmlFor="auto-check-dialog"
                            icon={CheckCheck}
                            label="Auto-check answers"
                            detail={
                                supportsAutoCheck
                                    ? "Submit when your typed answer is correct, or immediately when you pick a quiz option"
                                    : "Not used in flashcard mode — reveal and rate yourself"
                            }
                        >
                            <Switch
                                id="auto-check-dialog"
                                checked={tempAutoCheck}
                                onCheckedChange={setTempAutoCheck}
                                disabled={!supportsAutoCheck}
                            />
                        </SettingRow>
                        <SettingRow
                            htmlFor="sound-enabled"
                            icon={Bell}
                            label="Practice sounds"
                            detail="Short chimes on correct and incorrect answers"
                        >
                            <Switch
                                id="sound-enabled"
                                checked={tempSoundEnabled}
                                onCheckedChange={setTempSoundEnabled}
                            />
                        </SettingRow>
                    </SettingsList>
                    <p className="mt-2.5 px-1 text-xs text-muted-foreground">
                        Stuck on a word? Tap <span className="font-semibold">Show meaning &amp; example</span> during
                        any exercise to reveal its meaning, example sentence, and image.
                    </p>
                </SettingsSection>

                {includeSessionPrefs && <SessionPrefsFields ref={sessionPrefsRef} />}
            </div>

            <DialogFooter className="shrink-0 flex-row gap-2 border-t border-border/70 px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:pb-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
                    Cancel
                </Button>
                <Button type="button" onClick={handleSave} className="flex-1 sm:flex-none">
                    Save
                </Button>
            </DialogFooter>
        </>
    );
}

function SettingsSection({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
    return (
        <section>
            <h3 className="mb-2.5 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</h3>
            {children}
        </section>
    );
}

/** A rounded group of setting rows, split by hairlines. */
function SettingsList({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70">{children}</div>
    );
}

/** One setting: icon, label and a line of help on the left, its control on the right. */
function SettingRow({
    htmlFor,
    icon: Icon,
    label,
    detail,
    children,
}: Readonly<{ htmlFor: string; icon: LucideIcon; label: string; detail: string; children: ReactNode }>) {
    return (
        <div className="flex min-h-14 items-center gap-3 px-3 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
                <Label htmlFor={htmlFor} className="text-sm font-semibold">
                    {label}
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
            </div>
            <div className="shrink-0">{children}</div>
        </div>
    );
}

/**
 * Session-scope prefs (words per session + daily goal), shown only on the
 * pre-practice setup dialog. Owns its own temp state and commits on Save via
 * the imperative handle so the form keeps a single Save button.
 */
const SessionPrefsFields = forwardRef<SessionPrefsHandle>(function SessionPrefsFields(_props, ref) {
    const { dueWordsLimit } = useDueWordsLimit();
    const { newWordsLimit } = useNewWordsLimit();
    const { goal } = useDailyHabitDisplay();
    const updateGoal = useUpdateDailyGoalMutation();
    const { data: learningSettings } = useGetLearningSettingsQuery();
    const updateLearningSettings = useUpdateLearningSettingsMutation();

    const [tempLimit, setTempLimit] = useState(dueWordsLimit);
    const [tempNewLimit, setTempNewLimit] = useState(newWordsLimit);
    // Null until the user picks — falls back to the current (or default) goal.
    const [tempGoal, setTempGoal] = useState<number | null>(null);
    const selectedGoal = tempGoal ?? goal ?? DAILY_GOAL_OPTIONS[1];
    // Null until the user picks — falls back to the server (or default) limits.
    const [tempNewWordLimit, setTempNewWordLimit] = useState<number | null>(null);
    const [tempReviewLimit, setTempReviewLimit] = useState<number | null>(null);
    const selectedNewWordLimit =
        tempNewWordLimit ??
        learningSettings?.dailyNewWordLimit ??
        DAILY_NEW_WORD_LIMIT_OPTIONS[1];
    const selectedReviewLimit =
        tempReviewLimit ??
        learningSettings?.dailyReviewLimit ??
        DAILY_REVIEW_LIMIT_OPTIONS[1];

    useImperativeHandle(ref, () => ({
        commit: () => {
            setDueWordsLimit(tempLimit);
            setNewWordsLimit(tempNewLimit);
            if (tempGoal != null && tempGoal !== goal) {
                updateGoal.mutate(
                    { dailyGoal: tempGoal },
                    { onError: () => toast.error("Couldn't update your daily goal") },
                );
            }
            const newWordChanged =
                tempNewWordLimit != null &&
                tempNewWordLimit !== learningSettings?.dailyNewWordLimit;
            const reviewChanged =
                tempReviewLimit != null &&
                tempReviewLimit !== learningSettings?.dailyReviewLimit;
            if (newWordChanged || reviewChanged) {
                updateLearningSettings.mutate(
                    {
                        ...(newWordChanged ? { dailyNewWordLimit: tempNewWordLimit } : {}),
                        ...(reviewChanged ? { dailyReviewLimit: tempReviewLimit } : {}),
                    },
                    { onError: () => toast.error("Couldn't update your daily limits") },
                );
            }
        },
    }));

    const selectClassName =
        "h-10 rounded-xl border border-input bg-background px-3 text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-ring";

    return (
        <>
            <SettingsSection title="Words per session">
                <SettingsList>
                    <SettingRow
                        htmlFor="words-per-session"
                        icon={ListOrdered}
                        label="Words / session"
                        detail="Total words in one practice session"
                    >
                        <select
                            id="words-per-session"
                            value={tempLimit}
                            onChange={(e) => setTempLimit(Number(e.target.value))}
                            className={selectClassName}
                        >
                            {DUE_WORDS_LIMIT_OPTIONS.map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </SettingRow>
                    <SettingRow
                        htmlFor="new-words-per-session"
                        icon={Sparkles}
                        label="New words / session"
                        detail="At most this many of them are new words"
                    >
                        <select
                            id="new-words-per-session"
                            value={tempNewLimit}
                            onChange={(e) => setTempNewLimit(Number(e.target.value))}
                            className={selectClassName}
                        >
                            {NEW_WORDS_LIMIT_OPTIONS.map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </SettingRow>
                </SettingsList>
                <p className="mt-2.5 px-1 text-xs text-muted-foreground">
                    Due reviews come first, and new words fill whatever room is left.
                </p>
            </SettingsSection>

            <SettingsSection title="Every day">
                <SettingsList>
                    <SettingRow
                        htmlFor="daily-goal"
                        icon={Target}
                        label="Daily goal"
                        detail="Words to practice each day to keep your streak"
                    >
                        <select
                            id="daily-goal"
                            value={selectedGoal}
                            onChange={(e) => setTempGoal(Number(e.target.value))}
                            className={selectClassName}
                        >
                            {DAILY_GOAL_OPTIONS.map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </SettingRow>
                    <SettingRow
                        htmlFor="daily-new-word-limit"
                        icon={Sunrise}
                        label="New words / day"
                        detail="Most new words we'll introduce in a day"
                    >
                        <select
                            id="daily-new-word-limit"
                            value={selectedNewWordLimit}
                            onChange={(e) => setTempNewWordLimit(Number(e.target.value))}
                            className={selectClassName}
                        >
                            {DAILY_NEW_WORD_LIMIT_OPTIONS.map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </SettingRow>
                    <SettingRow
                        htmlFor="daily-review-limit"
                        icon={RefreshCw}
                        label="Reviews / day"
                        detail="Most due reviews we'll surface in a day"
                    >
                        <select
                            id="daily-review-limit"
                            value={selectedReviewLimit}
                            onChange={(e) => setTempReviewLimit(Number(e.target.value))}
                            className={selectClassName}
                        >
                            {DAILY_REVIEW_LIMIT_OPTIONS.map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </SettingRow>
                </SettingsList>
                <p className="mt-2.5 px-1 text-xs text-muted-foreground">
                    Daily limits keep new material and reviews steady.
                </p>
            </SettingsSection>
        </>
    );
});

export default function PracticeSettingsDialog({
    isOpen,
    onClose,
    includeSessionPrefs = false,
}: Readonly<PracticeSettingsDialogProps>) {
    // Stateful: the dialog owns its settings via the shared hook.
    const { settings, setSettings } = usePracticeSettings();
    const settingsKey = `${settings.mode}-${settings.mixedModes.join(",")}-${settings.autoCheck}-${settings.soundEnabled}`;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="flex flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
                {isOpen && (
                    <PracticeSettingsForm
                        key={settingsKey}
                        currentSettings={settings}
                        onSave={setSettings}
                        onClose={onClose}
                        includeSessionPrefs={includeSessionPrefs}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
