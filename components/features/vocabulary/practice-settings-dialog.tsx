"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Sparkles,
    Keyboard,
    CheckSquare,
    Volume2,
    MessageSquare,
    ImageIcon,
    Shuffle,
    TextCursorInput,
} from "lucide-react";

export type PracticeMode =
    | "flashcard"
    | "typing"
    | "multiple-choice"
    | "listening"
    | "cloze"
    | "mixed";

export interface PracticeSettings {
    mode: PracticeMode;
    autoCheck: boolean;
    showExampleHints: boolean;
    showImageHints: boolean;
}

interface PracticeSettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    currentSettings: PracticeSettings;
    onSave: (settings: PracticeSettings) => void;
}

export default function PracticeSettingsDialog({
    isOpen,
    onClose,
    currentSettings,
    onSave,
}: Readonly<PracticeSettingsDialogProps>) {
    const [tempMode, setTempMode] = useState<PracticeMode>(currentSettings.mode);
    const [tempAutoCheck, setTempAutoCheck] = useState(currentSettings.autoCheck);
    const [tempShowExampleHints, setTempShowExampleHints] = useState(currentSettings.showExampleHints);
    const [tempShowImageHints, setTempShowImageHints] = useState(currentSettings.showImageHints);

    useEffect(() => {
        if (isOpen) {
            setTempMode(currentSettings.mode);
            setTempAutoCheck(currentSettings.autoCheck);
            setTempShowExampleHints(currentSettings.showExampleHints);
            setTempShowImageHints(currentSettings.showImageHints);
        }
    }, [isOpen, currentSettings]);

    const handleSave = () => {
        onSave({
            mode: tempMode,
            autoCheck: tempAutoCheck,
            showExampleHints: tempShowExampleHints,
            showImageHints: tempShowImageHints,
        });
        onClose();
    };

    const handleCancel = () => {
        setTempMode(currentSettings.mode);
        setTempAutoCheck(currentSettings.autoCheck);
        setTempShowExampleHints(currentSettings.showExampleHints);
        setTempShowImageHints(currentSettings.showImageHints);
        onClose();
    };

    const isTyping = tempMode === "typing";
    const isMixed = tempMode === "mixed";

    const modes: { id: PracticeMode; icon: typeof Sparkles; label: string; desc: string }[] = [
        { id: "mixed", icon: Shuffle, label: "Mixed", desc: "Best for memory" },
        { id: "typing", icon: Keyboard, label: "Typing", desc: "Type the word" },
        { id: "listening", icon: Volume2, label: "Listening", desc: "Listen and type" },
        { id: "cloze", icon: TextCursorInput, label: "Fill-in", desc: "Complete the sentence" },
        { id: "multiple-choice", icon: CheckSquare, label: "Quiz", desc: "Pick the meaning" },
        { id: "flashcard", icon: Sparkles, label: "Flashcard", desc: "Reveal and rate" },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={handleCancel}>
            <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
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
                            <p className="text-xs text-muted-foreground mt-2">
                                Rotates typing, listening, quiz, and fill-in for stronger recall.
                            </p>
                        )}
                    </div>

                    {isTyping && (
                        <div className="space-y-3 pt-4 border-t border-border">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <Label htmlFor="auto-check-dialog" className="text-sm font-medium">
                                        Auto-check answers
                                    </Label>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Validate correct answers as you type
                                    </p>
                                </div>
                                <Switch
                                    id="auto-check-dialog"
                                    checked={tempAutoCheck}
                                    onCheckedChange={setTempAutoCheck}
                                    className="data-[state=checked]:bg-green-500"
                                />
                            </div>
                        </div>
                    )}

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
                </div>

                <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSave}>
                        Save Settings
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
