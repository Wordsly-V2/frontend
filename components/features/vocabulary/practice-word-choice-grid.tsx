"use client";

import { AdaptiveText } from "@/components/common/adaptive-text";
import { Button } from "@/components/ui/button";

interface PracticeWordChoiceGridProps {
    options: string[];
    onSelect: (option: string) => void;
    disabled?: boolean;
    selectedOption?: string | null;
}

export function PracticeWordChoiceGrid({
    options,
    onSelect,
    disabled = false,
    selectedOption = null,
}: Readonly<PracticeWordChoiceGridProps>) {
    return (
        <div className="grid gap-3">
            {options.map((option, index) => (
                <Button
                    key={option}
                    variant={selectedOption === option && !disabled ? "default" : "outline"}
                    onClick={() => !disabled && onSelect(option)}
                    disabled={disabled}
                    className="min-h-[56px] h-auto py-3 justify-start text-left rounded-xl whitespace-normal"
                >
                    <span className="font-bold mr-3 shrink-0">
                        {String.fromCharCode(65 + index)}.
                    </span>
                    <AdaptiveText
                        text={option}
                        role="word"
                        as="span"
                        className="flex-1 !text-base sm:!text-lg !font-medium"
                        scrollWhenLong={false}
                    />
                    <span className="ml-auto text-xs text-muted-foreground shrink-0">
                        {String.fromCharCode(65 + index)}
                    </span>
                </Button>
            ))}
        </div>
    );
}
