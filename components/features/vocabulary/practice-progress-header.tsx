"use client";

interface PracticeProgressHeaderProps {
    currentIndex: number;
    total: number;
    sessionStreak?: number;
    isRetryPass?: boolean;
}

export function PracticeProgressHeader({
    currentIndex,
    total,
    sessionStreak = 0,
    isRetryPass = false,
}: Readonly<PracticeProgressHeaderProps>) {
    const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 100;

    return (
        <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-muted-foreground mb-2">
                <span>Progress</span>
                <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tabular-nums">
                    {currentIndex + 1} / {total}
                </span>
            </div>
            <div className="h-2 sm:h-2.5 bg-muted rounded-full overflow-hidden shadow-inner">
                <div
                    className="h-full bg-gradient-to-r from-primary to-[var(--brand-accent)] transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
            {sessionStreak >= 3 && (
                <p className="text-xs text-primary mt-1.5 font-medium">
                    {sessionStreak} in a row
                </p>
            )}
            {isRetryPass && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1.5 font-medium">
                    Extra round — missed words
                </p>
            )}
        </div>
    );
}
