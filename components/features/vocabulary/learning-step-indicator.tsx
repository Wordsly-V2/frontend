"use client";

import { cn } from "@/lib/utils";
import { BookOpen, ChevronRight, Sparkles } from "lucide-react";

interface LearningStepIndicatorProps {
    activeStep: "intro" | "practice";
    className?: string;
}

function Step({
    label,
    icon: Icon,
    active,
    done,
}: Readonly<{
    label: string;
    icon: typeof Sparkles;
    active: boolean;
    done: boolean;
}>) {
    return (
        <div
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                active && "bg-primary/15 text-primary",
                done && !active && "bg-muted text-muted-foreground",
                !active && !done && "bg-muted/50 text-muted-foreground/70",
            )}
        >
            <Icon className="h-3.5 w-3.5" aria-hidden />
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
            className={cn("flex items-center justify-center gap-2", className)}
            aria-label={`Learning step: ${activeStep === "intro" ? "Learn" : "Practice"}`}
        >
            <Step
                label="Learn"
                icon={Sparkles}
                active={activeStep === "intro"}
                done={activeStep === "practice"}
            />
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden />
            <Step
                label="Practice"
                icon={BookOpen}
                active={activeStep === "practice"}
                done={false}
            />
        </div>
    );
}
