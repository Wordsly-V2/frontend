"use client";

import { useMemo } from "react";
import { Award, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
    AchievementCategory,
    IReportAchievement,
} from "@/types/learning-report/learning-report.type";
import { ChartCard } from "./chart-card";

interface AchievementsGridProps {
    achievements: IReportAchievement[];
}

const CATEGORY_ORDER: AchievementCategory[] = ["streak", "words", "days"];

/**
 * Show every unlocked badge plus the next locked target per category, so the
 * grid celebrates progress without listing every far-off milestone.
 */
function selectVisible(
    achievements: IReportAchievement[],
): IReportAchievement[] {
    const visible: IReportAchievement[] = [];
    for (const category of CATEGORY_ORDER) {
        const inCategory = achievements
            .filter((a) => a.category === category)
            .sort((a, b) => a.target - b.target);
        const achieved = inCategory.filter((a) => a.achieved);
        const nextLocked = inCategory.find((a) => !a.achieved);
        visible.push(...achieved);
        if (nextLocked) visible.push(nextLocked);
    }
    return visible;
}

function AchievementTile({ badge }: Readonly<{ badge: IReportAchievement }>) {
    const progress = badge.achieved
        ? 100
        : Math.min(100, Math.round((badge.value / badge.target) * 100));
    return (
        <div
            className={cn(
                "rounded-xl border p-3 transition-colors",
                badge.achieved
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-muted/20",
            )}
        >
            <div className="flex items-center gap-2">
                <div
                    className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        badge.achieved
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground",
                    )}
                >
                    {badge.achieved ? (
                        <Award className="h-4 w-4" />
                    ) : (
                        <Lock className="h-3.5 w-3.5" />
                    )}
                </div>
                <p
                    className={cn(
                        "text-xs font-semibold leading-tight",
                        badge.achieved
                            ? "text-foreground"
                            : "text-muted-foreground",
                    )}
                >
                    {badge.label}
                </p>
            </div>
            {!badge.achieved && (
                <div className="mt-2.5">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-primary/60"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                        {badge.value.toLocaleString()} / {badge.target.toLocaleString()}
                    </p>
                </div>
            )}
        </div>
    );
}

export function AchievementsGrid({
    achievements,
}: Readonly<AchievementsGridProps>) {
    const visible = useMemo(
        () => selectVisible(achievements),
        [achievements],
    );
    const unlockedCount = achievements.filter((a) => a.achieved).length;

    return (
        <ChartCard
            title="Achievements"
            subtitle={`${unlockedCount} of ${achievements.length} unlocked`}
        >
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {visible.map((badge) => (
                    <AchievementTile key={badge.key} badge={badge} />
                ))}
            </div>
        </ChartCard>
    );
}
