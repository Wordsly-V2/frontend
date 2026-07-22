"use client";

import {
    forwardRef,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
import { usePracticeSettings } from "@/hooks/usePracticeSettings.hook";
import { useDueWordsLimit, setDueWordsLimit } from "@/hooks/useDueWordsLimit.hook";
import { useNewWordsLimit, setNewWordsLimit } from "@/hooks/useNewWordsLimit.hook";
import {
    MIXED_PRACTICE_MODES,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
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
                : MIXED_PRACTICE_MODES.filter(
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
        tempMode === "cloze";

    const modes: { id: PracticeMode; icon: typeof Sparkles; label: string; desc: string }[] = [
        { id: "mixed", icon: Shuffle, label: "Mixed", desc: "Best for memory" },
        { id: "listening", icon: Volume2, label: "Listening", desc: "Listen and type" },
        { id: "context", icon: MessageSquare, label: "In context", desc: "Type the word in a sentence" },
        { id: "cloze", icon: TextCursorInput, label: "Fill-in", desc: "Pick the word in context" },
        { id: "word-bank", icon: LayoutGrid, label: "Word bank", desc: "Pick the word for a meaning" },
        { id: "flashcard", icon: Sparkles, label: "Flashcard", desc: "Reveal and rate" },
    ];

    return (
        <>
            <DialogHeader>
                <DialogTitle>Practice Settings</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
                <div>
                    <Label className="text-sm font-medium mb-3 block">Practice Mode</Label>
                    <div className="grid grid-cols-2 gap-3">
                        {modes.map(({ id, icon: Icon, label, desc }) => (
                            <Button
                                key={id}
                                type="button"
                                size="lg"
                                variant={tempMode === id ? "default" : "outline"}
                                onClick={() => setTempMode(id)}
                                className="gap-2 h-auto py-4 flex-col"
                            >
                                <Icon className="h-5 w-5" />
                                <span className="font-medium">{label}</span>
                                <span className="text-xs opacity-80 font-normal">
                                    {desc}
                                </span>
                            </Button>
                        ))}
                    </div>
                    {isMixed && (
                        <div className="mt-4">
                            <p className="text-xs text-muted-foreground mb-3">
                                Choose which methods to mix. All are on for the strongest recall.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {MIXED_PRACTICE_MODES.map((method) => {
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
                                                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                                                selected
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-border bg-transparent text-muted-foreground hover:bg-muted",
                                            )}
                                        >
                                            <MethodIcon className="h-3.5 w-3.5" />
                                            {meta.shortLabel}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-3 pt-4 border-t border-border">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <Label htmlFor="auto-check-dialog" className="text-sm font-medium">
                                Auto-check answers
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                                {supportsAutoCheck
                                    ? "Submit when your typed answer is correct, or immediately when you pick a quiz option"
                                    : "Not used in flashcard mode — reveal and rate yourself"}
                            </p>
                        </div>
                        <Switch
                            id="auto-check-dialog"
                            checked={tempAutoCheck}
                            onCheckedChange={setTempAutoCheck}
                            disabled={!supportsAutoCheck}
                            className="data-[state=checked]:bg-green-500"
                        />
                    </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                        Stuck on a word? Tap <span className="font-medium">Show meaning &amp; example</span> during
                        any exercise to reveal its meaning, example sentence, and image.
                    </p>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <Label htmlFor="sound-enabled" className="text-sm font-medium flex items-center gap-2">
                                <Bell className="h-4 w-4 text-muted-foreground" />
                                Practice sounds
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                                Short chimes on correct and incorrect answers
                            </p>
                        </div>
                        <Switch
                            id="sound-enabled"
                            checked={tempSoundEnabled}
                            onCheckedChange={setTempSoundEnabled}
                        />
                    </div>
                </div>

                {includeSessionPrefs && <SessionPrefsFields ref={sessionPrefsRef} />}
            </div>

            <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="button" onClick={handleSave}>
                    Save Settings
                </Button>
            </DialogFooter>
        </>
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
        "h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

    return (
        <>
            <div className="space-y-4 pt-4 border-t border-border">
                <div>
                    <Label className="text-sm font-medium">Words per session</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                        Set review and new-word batches separately — e.g. review
                        more words but take on fewer new ones each session.
                    </p>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                        <Label htmlFor="words-per-session" className="text-sm font-medium flex items-center gap-2">
                            <ListOrdered className="h-4 w-4 text-muted-foreground" />
                            Review words / session
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                            Words in each review &amp; practice batch
                        </p>
                    </div>
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
                </div>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                        <Label htmlFor="new-words-per-session" className="text-sm font-medium flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-muted-foreground" />
                            New words / session
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                            New words introduced in each learn-new batch
                        </p>
                    </div>
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
                </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                        <Label htmlFor="daily-goal" className="text-sm font-medium flex items-center gap-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            Daily goal
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                            Words to practice each day to keep your streak
                        </p>
                    </div>
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
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
                <div>
                    <Label className="text-sm font-medium">Daily limits</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                        Cap how much new material and review each day so practice
                        stays steady.
                    </p>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                        <Label htmlFor="daily-new-word-limit" className="text-sm font-medium flex items-center gap-2">
                            <Sunrise className="h-4 w-4 text-muted-foreground" />
                            New words / day
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                            Most new words we&apos;ll introduce in a day
                        </p>
                    </div>
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
                </div>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                        <Label htmlFor="daily-review-limit" className="text-sm font-medium flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 text-muted-foreground" />
                            Reviews / day
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                            Most due reviews we&apos;ll surface in a day
                        </p>
                    </div>
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
                </div>
            </div>
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
            <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
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
