"use client";

import PracticeSettingsDialog from "@/components/features/vocabulary/practice-settings-dialog";
import WordsSummaryDialog from "@/components/features/vocabulary/words-summary-dialog";
import { Button } from "@/components/ui/button";
import type { IWord } from "@/types/courses/courses.type";
import { List, Settings2 } from "lucide-react";

interface PracticeToolbarProps {
    showSettings: boolean;
    showWordsList: boolean;
    queue: IWord[];
    currentIndex: number;
    onOpenSettings: () => void;
    onCloseSettings: () => void;
    onOpenWordsList: () => void;
    onCloseWordsList: () => void;
    hidden?: boolean;
}

export function PracticeToolbar({
    showSettings,
    showWordsList,
    queue,
    currentIndex,
    onOpenSettings,
    onCloseSettings,
    onOpenWordsList,
    onCloseWordsList,
    hidden = false,
}: Readonly<PracticeToolbarProps>) {
    if (hidden) return null;

    return (
        <>
            <div className="flex items-center gap-0.5">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onOpenWordsList}
                    className="h-9 w-9 rounded-xl text-muted-foreground"
                    aria-label="View word list"
                >
                    <List className="h-5 w-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onOpenSettings}
                    className="h-9 w-9 rounded-xl text-muted-foreground"
                    aria-label="Practice settings"
                >
                    <Settings2 className="h-5 w-5" />
                </Button>
            </div>

            <PracticeSettingsDialog
                isOpen={showSettings}
                onClose={onCloseSettings}
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
