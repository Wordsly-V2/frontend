"use client";

import { cn } from "@/lib/utils";
import { BookOpen, Check, ChevronRight, Sparkles } from "lucide-react";

interface LearningStepIndicatorProps {
    activeStep: "intro" | "practice";
    className?: string;
}

function Step({
    label,
    icon: Icon,
    active,
    done,
    stepNumber,
}: Readonly<{
    label: string;
    icon: typeof Sparkles;
    active: boolean;
    done: boolean;
    stepNumber: number;
}>) {
    return (
        <div
            className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all",
                active && "bg-primary/10 text-primary ring-1 ring-primary/20",
                done && !active && "bg-muted/80 text-muted-foreground",
                !active && !done && "bg-muted/40 text-muted-foreground/60",
            )}
        >
            <span
                className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0",
                    active && "bg-primary text-primary-foreground",
                    done && !active && "bg-primary/20 text-primary",
                    !active && !done && "bg-muted text-muted-foreground",
                )}
            >
                {done && !active ? <Check className="h-3 w-3" /> : stepNumber}
            </span>
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {label}
        </div>
    );
}

export function LearningStepIndicator({
    activeStep,
    className,
}: Readonly<LearningStepIndicatorProps>) {
    return (
        <div
            className={cn("flex items-center justify-center gap-1.5 sm:gap-2", className)}
            aria-label={`Learning step: ${activeStep === "intro" ? "Learn" : "Practice"}`}
        >
            <Step
                label="Learn"
                icon={Sparkles}
                active={activeStep === "intro"}
                done={activeStep === "practice"}
                stepNumber={1}
            />
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" aria-hidden />
            <Step
                label="Practice"
                icon={BookOpen}
                active={activeStep === "practice"}
                done={false}
                stepNumber={2}
            />
        </div>
    );
}
