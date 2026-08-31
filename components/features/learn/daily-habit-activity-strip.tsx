"use client";

import type { IDailyHabitDay } from "@/types/daily-habit/daily-habit.type";
import { cn } from "@/lib/utils";

interface DailyHabitActivityStripProps {
    days: IDailyHabitDay[];
    today: string;
    className?: string;
}

function dayLabel(date: string, today: string): string {
    if (date === today) return "Today";
    const [y, m, d] = date.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
        weekday: "short",
    });
}

export function DailyHabitActivityStrip({
    days,
    today,
    className,
}: Readonly<DailyHabitActivityStripProps>) {
    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">Last 7 days</p>
                <p className="text-xs text-muted-foreground">
                    <span className="inline-block h-2 w-2 rounded-full bg-primary mr-1 align-middle" />
                    Goal met
                </p>
            </div>
            <div
                className="grid grid-cols-7 gap-1.5 sm:gap-2"
                role="list"
                aria-label="Recent daily practice activity"
            >
                {days.map((day) => {
                    const isToday = day.date === today;
                    const active = day.words > 0;
                    // A day no practice happened on, but a freeze paid for — the
                    // streak ran through it, so it isn't a miss.
                    const frozen = day.frozen === true && !active;
                    return (
                        <div
                            key={day.date}
                            role="listitem"
                            className="flex flex-col items-center gap-1.5 min-w-0"
                            title={
                                frozen
                                    ? `${dayLabel(day.date, today)}: streak freeze used`
                                    : `${dayLabel(day.date, today)}: ${day.words} word${day.words === 1 ? "" : "s"}${day.goalMet ? " · goal met" : ""}`
                            }
                        >
                            <div
                                className={cn(
                                    "h-8 w-full max-w-[2.5rem] rounded-lg border transition-colors flex items-center justify-center",
                                    day.goalMet
                                        ? "border-primary/40 bg-primary/20"
                                        : active
                                          ? "border-orange-400/40 bg-orange-400/15"
                                          : frozen
                                            ? "border-sky-400/40 bg-sky-400/15"
                                            : "border-border/60 bg-muted/40",
                                    isToday && "ring-2 ring-primary/30 ring-offset-1 ring-offset-background",
                                )}
                            >
                                {frozen && (
                                    <span
                                        aria-hidden
                                        className="text-[10px] leading-none text-sky-500"
                                    >
                                        ❄
                                    </span>
                                )}
                            </div>
                            <span
                                className={cn(
                                    "text-[10px] leading-none tabular-nums",
                                    isToday
                                        ? "font-semibold text-foreground"
                                        : "text-muted-foreground",
                                )}
                            >
                                {dayLabel(day.date, today).slice(0, 3)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
