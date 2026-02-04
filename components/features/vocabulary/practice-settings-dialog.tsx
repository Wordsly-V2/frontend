"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles, Keyboard } from "lucide-react";

export type PracticeMode = "flashcard" | "typing";

export interface PracticeSettings {
    mode: PracticeMode;
    autoCheck: boolean;
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

    // Update temp settings when dialog opens with current settings
    useEffect(() => {
        if (isOpen) {
            setTempMode(currentSettings.mode);
            setTempAutoCheck(currentSettings.autoCheck);
        }
    }, [isOpen, currentSettings]);

    const handleSave = () => {
        const newSettings: PracticeSettings = {
            mode: tempMode,
            autoCheck: tempAutoCheck,
        };
        onSave(newSettings);
        onClose();
    };

    const handleCancel = () => {
        // Reset temp settings to current settings
        setTempMode(currentSettings.mode);
        setTempAutoCheck(currentSettings.autoCheck);
        onClose();
    };

    const isFlashcard = tempMode === "flashcard";
    const isTyping = tempMode === "typing";

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
