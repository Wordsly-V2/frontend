import { cn } from "@/lib/utils";
import { GraduationCap } from "lucide-react";

/** The brand mark: a gradient tile with the cap. */
export function WordslyMark({ className }: Readonly<{ className?: string }>) {
    return (
        <span
            aria-hidden
            className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-brand shadow-md shadow-primary/25",
                className,
            )}
        >
            <GraduationCap className="h-5 w-5 text-white" />
        </span>
    );
}
