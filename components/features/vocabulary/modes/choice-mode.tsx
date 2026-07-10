"use client";

import { PracticeWordChoiceGrid } from "@/components/features/vocabulary/practice-word-choice-grid";
import { Button } from "@/components/ui/button";
import { memo, type ReactNode } from "react";

/**
 * Multiple-choice exercise shared by the cloze and word-bank modes — they are
 * identical apart from the prompt shown above the choice grid, which the caller
 * supplies as `prompt`.
 */
export interface ChoiceModeProps {
    /** Prompt shown above the grid (sentence for cloze, meaning for word-bank). */
    prompt: ReactNode;
    options: string[];
    onSelect: (option: string) => void;
    selectedOption: string | null;
    disabled: boolean;
    /** Auto-check submits on select; otherwise a Check button confirms. */
    autoCheck: boolean;
    onCheck: () => void;
    checkDisabled: boolean;
}

export const ChoiceMode = memo(function ChoiceMode({
    prompt,
    options,
    onSelect,
    selectedOption,
    disabled,
    autoCheck,
    onCheck,
    checkDisabled,
}: Readonly<ChoiceModeProps>) {
    return (
        <div className="space-y-5">
            <div className="text-center">{prompt}</div>
            <PracticeWordChoiceGrid
                options={options}
                onSelect={onSelect}
                selectedOption={autoCheck ? null : selectedOption}
                disabled={disabled}
            />
            {!autoCheck && (
                <div className="flex justify-center">
                    <Button onClick={onCheck} disabled={checkDisabled} className="rounded-xl">
                        Check
                    </Button>
                </div>
            )}
        </div>
    );
});
