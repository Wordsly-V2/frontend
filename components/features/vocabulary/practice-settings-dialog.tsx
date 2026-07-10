"use client";

import { useState } from "react";
import { usePracticeSettings } from "@/hooks/usePracticeSettings.hook";
import {
    MIXED_PRACTICE_MODES,
    type MixedPracticeMethod,
} from "@/lib/practice-settings";
import { getPracticeModeMeta } from "@/lib/practice-mode-meta";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Sparkles,
    Volume2,
    MessageSquare,
    ImageIcon,
    LayoutGrid,
    Shuffle,
    TextCursorInput,
    Bell,
} from "lucide-react";

export type PracticeMode =
    | "flashcard"
    | "context"
    | "multiple-choice"
    | "word-bank"
    | "listening"
    | "cloze"
    | "mixed";

export interface PracticeSettings {
    mode: PracticeMode;
    /** Which methods the mixed mode may rotate through. Empty = all. */
    mixedModes: MixedPracticeMethod[];
    autoCheck: boolean;
    showExampleHints: boolean;
    showImageHints: boolean;
    soundEnabled: boolean;
}

interface PracticeSettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

function PracticeSettingsForm({
    currentSettings,
    onSave,
    onClose,
}: Readonly<{
    currentSettings: PracticeSettings;
    onSave: (settings: PracticeSettings) => void;
    onClose: () => void;
}>) {
    const [tempMode, setTempMode] = useState(currentSettings.mode);
    const [tempMixedModes, setTempMixedModes] = useState<MixedPracticeMethod[]>(
        currentSettings.mixedModes.length > 0
            ? currentSettings.mixedModes
            : [...MIXED_PRACTICE_MODES],
    );
    const [tempAutoCheck, setTempAutoCheck] = useState(currentSettings.autoCheck);
    const [tempShowExampleHints, setTempShowExampleHints] = useState(currentSettings.showExampleHints);
    const [tempShowImageHints, setTempShowImageHints] = useState(currentSettings.showImageHints);
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
            showExampleHints: tempShowExampleHints,
            showImageHints: tempShowImageHints,
            soundEnabled: tempSoundEnabled,
        });
        onClose();
    };

    const isMixed = tempMode === "mixed";
    const supportsAutoCheck =
        isMixed ||
        tempMode === "listening" ||
        tempMode === "context" ||
        tempMode === "multiple-choice" ||
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
                                <span className="text-xs opacity-80 font-normal">{desc}</span>
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
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <Label htmlFor="show-example-hints" className="text-sm font-medium flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                Example hints
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                                Show sentences with the word hidden (***)
                            </p>
                        </div>
                        <Switch
                            id="show-example-hints"
                            checked={tempShowExampleHints}
                            onCheckedChange={setTempShowExampleHints}
                        />
                    </div>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <Label htmlFor="show-image-hints" className="text-sm font-medium flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                Image hints
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                                Show a picture when available
                            </p>
                        </div>
                        <Switch
                            id="show-image-hints"
                            checked={tempShowImageHints}
                            onCheckedChange={setTempShowImageHints}
                        />
                    </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border">
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

export default function PracticeSettingsDialog({
    isOpen,
    onClose,
}: Readonly<PracticeSettingsDialogProps>) {
    // Stateful: the dialog owns its settings via the shared hook.
    const { settings, setSettings } = usePracticeSettings();
    const settingsKey = `${settings.mode}-${settings.mixedModes.join(",")}-${settings.autoCheck}-${settings.showExampleHints}-${settings.showImageHints}-${settings.soundEnabled}`;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
                {isOpen && (
                    <PracticeSettingsForm
                        key={settingsKey}
                        currentSettings={settings}
                        onSave={setSettings}
                        onClose={onClose}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
