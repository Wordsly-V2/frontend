"use client";

import PracticeSettingsDialog, {
    type PracticeSettings,
} from "@/components/features/vocabulary/practice-settings-dialog";
import WordsSummaryDialog from "@/components/features/vocabulary/words-summary-dialog";
import { Button } from "@/components/ui/button";
import { stageLabel, type WordLearningStage } from "@/lib/word-progress-stage";
import type { IWord } from "@/types/courses/courses.type";
import { List, Settings2 } from "lucide-react";

interface PracticeToolbarProps {
    modeLabel: string;
    currentStage: WordLearningStage;
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
    modeLabel,
    currentStage,
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
            <div className="flex justify-center gap-2 sm:gap-3 mb-4 sm:mb-6 flex-wrap">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onOpenSettings}
                    className="gap-1.5 rounded-full text-xs sm:text-sm"
                >
                    <Settings2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Settings
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onOpenWordsList}
                    className="gap-1.5 rounded-full text-xs sm:text-sm"
                >
                    <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Words
                </Button>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground capitalize">
                    {modeLabel}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {stageLabel(currentStage)}
                </span>
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
