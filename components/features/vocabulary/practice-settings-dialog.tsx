"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles, Keyboard, CheckSquare, Volume2, MessageSquare, ImageIcon } from "lucide-react";

export type PracticeMode = "flashcard" | "typing" | "multiple-choice" | "listening";

export interface PracticeSettings {
    mode: PracticeMode;
    autoCheck: boolean;
    /** When true, show example sentences with the word replaced by *** to help guess. */
    showExampleHints: boolean;
    /** When true, show the word's image (if any) next to example hints. */
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

    // Update temp settings when dialog opens with current settings
    useEffect(() => {
        const _initialSettings = () => {
            if (isOpen) {
                setTempMode(currentSettings.mode);
                setTempAutoCheck(currentSettings.autoCheck);
                setTempShowExampleHints(currentSettings.showExampleHints);
                setTempShowImageHints(currentSettings.showImageHints);
            }
        }

        _initialSettings();
    }, [isOpen, currentSettings]);

    const handleSave = () => {
        const newSettings: PracticeSettings = {
            mode: tempMode,
            autoCheck: tempAutoCheck,
            showExampleHints: tempShowExampleHints,
            showImageHints: tempShowImageHints,
        };
        onSave(newSettings);
        onClose();
    };

    const handleCancel = () => {
        // Reset temp settings to current settings
        setTempMode(currentSettings.mode);
        setTempAutoCheck(currentSettings.autoCheck);
        setTempShowExampleHints(currentSettings.showExampleHints);
        setTempShowImageHints(currentSettings.showImageHints);
        onClose();
    };

    const isFlashcard = tempMode === "flashcard";
    const isTyping = tempMode === "typing";
    const isMultipleChoice = tempMode === "multiple-choice";
    const isListening = tempMode === "listening";

    return (
        <Dialog open={isOpen} onOpenChange={handleCancel}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Practice Settings</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Mode Selection */}
                    <div>
                        <Label className="text-sm font-medium mb-3 block">Practice Mode</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                type="button"
                                size="lg"
                                variant={isFlashcard ? "default" : "outline"}
                                onClick={() => setTempMode("flashcard")}
                                className="gap-2 h-auto py-4 flex-col"
                            >
                                <Sparkles className="h-5 w-5" />
                                <span className="font-medium">Flashcard</span>
                                <span className="text-xs opacity-80 font-normal">
                                    Learn at your pace
                                </span>
                            </Button>
                            <Button
                                type="button"
                                size="lg"
                                variant={isTyping ? "default" : "outline"}
                                onClick={() => setTempMode("typing")}
                                className="gap-2 h-auto py-4 flex-col"
                            >
                                <Keyboard className="h-5 w-5" />
                                <span className="font-medium">Typing</span>
                                <span className="text-xs opacity-80 font-normal">
                                    Type to practice
                                </span>
                            </Button>
                            <Button
                                type="button"
                                size="lg"
                                variant={isMultipleChoice ? "default" : "outline"}
                                onClick={() => setTempMode("multiple-choice")}
                                className="gap-2 h-auto py-4 flex-col"
                            >
                                <CheckSquare className="h-5 w-5" />
                                <span className="font-medium">Quiz</span>
                                <span className="text-xs opacity-80 font-normal">
                                    Choose the answer
                                </span>
                            </Button>
                            <Button
                                type="button"
                                size="lg"
                                variant={isListening ? "default" : "outline"}
                                onClick={() => setTempMode("listening")}
                                className="gap-2 h-auto py-4 flex-col"
                            >
                                <Volume2 className="h-5 w-5" />
                                <span className="font-medium">Listening</span>
                                <span className="text-xs opacity-80 font-normal">
                                    Listen and type
                                </span>
                            </Button>
                        </div>
                    </div>

                    {/* Auto-check Toggle (only for typing mode) */}
                    {isTyping && (
                        <div className="space-y-3 pt-4 border-t border-border">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <Label htmlFor="auto-check-dialog" className="text-sm font-medium">
                                        Auto-check answers
                                    </Label>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Automatically validate correct answers as you type
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

                    {/* Example hints — applies to all modes */}
                    <div className="space-y-3 pt-4 border-t border-border">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <Label htmlFor="show-example-hints" className="text-sm font-medium flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                    Example hints
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Show example sentences with the word hidden (***) to help you guess
                                </p>
                            </div>
                            <Switch
                                id="show-example-hints"
                                checked={tempShowExampleHints}
                                onCheckedChange={setTempShowExampleHints}
                                className="data-[state=checked]:bg-green-500"
                            />
                        </div>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <Label htmlFor="show-image-hints" className="text-sm font-medium flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                    Image hints
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Show a picture for the word next to example hints when available
                                </p>
                            </div>
                            <Switch
                                id="show-image-hints"
                                checked={tempShowImageHints}
                                onCheckedChange={setTempShowImageHints}
                                className="data-[state=checked]:bg-green-500"
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
