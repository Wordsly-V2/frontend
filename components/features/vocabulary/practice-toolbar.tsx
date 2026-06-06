"use client";

import PracticeSettingsDialog, {
    type PracticeSettings,
} from "@/components/features/vocabulary/practice-settings-dialog";
import WordsSummaryDialog from "@/components/features/vocabulary/words-summary-dialog";
import { Button } from "@/components/ui/button";
import type { IWord } from "@/types/courses/courses.type";
import { List, Settings2 } from "lucide-react";

interface PracticeToolbarProps {
    showSettings: boolean;
    showWordsList: boolean;
    practiceSettings: PracticeSettings;
    queue: IWord[];
    currentIndex: number;
    onOpenSettings: () => void;
    onCloseSettings: () => void;
    onOpenWordsList: () => void;
    onCloseWordsList: () => void;
    onSaveSettings: (settings: PracticeSettings) => void;
    hidden?: boolean;
}

export function PracticeToolbar({
    showSettings,
    showWordsList,
    practiceSettings,
    queue,
    currentIndex,
    onOpenSettings,
    onCloseSettings,
    onOpenWordsList,
    onCloseWordsList,
    onSaveSettings,
    hidden = false,
}: Readonly<PracticeToolbarProps>) {
    if (hidden) return null;

    return (
        <>
            <div className="flex justify-end gap-1.5 mb-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onOpenWordsList}
                    className="h-8 w-8 rounded-lg text-muted-foreground"
                    aria-label="View word list"
                >
                    <List className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onOpenSettings}
                    className="h-8 w-8 rounded-lg text-muted-foreground"
                    aria-label="Practice settings"
                >
                    <Settings2 className="h-4 w-4" />
                </Button>
            </div>

            <PracticeSettingsDialog
                isOpen={showSettings}
                onClose={onCloseSettings}
                currentSettings={practiceSettings}
                onSave={onSaveSettings}
            />

            <WordsSummaryDialog
                isOpen={showWordsList}
                onClose={onCloseWordsList}
                words={queue}
                currentIndex={currentIndex}
            />
        </>
    );
}
