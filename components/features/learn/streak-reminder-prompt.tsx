"use client";

import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useDailyHabitWithFallback } from "@/queries/daily-habit.query";
import {
    getLocalStorageItem,
    setLocalStorageItem,
} from "@/lib/local-storage";
import { cn } from "@/lib/utils";
import { Bell, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { startTransition, useEffect, useState } from "react";

const STREAK_PROMPT_DISMISSED_KEY = "streak_reminder_prompt_dismissed";

/**
 * Soft opt-in for streak reminders shown on the Learn home screen once the
 * learner has a streak worth protecting and hasn't decided about notifications.
 * The permission request only fires from the "Turn on" click.
 */
export function StreakReminderPrompt({ className }: { className?: string }) {
    const habit = useDailyHabitWithFallback();
    const { status, isBusy, enable } = usePushNotifications();
    const reduceMotion = useReducedMotion();
    const [dismissed, setDismissed] = useState(true);

    useEffect(() => {
        startTransition(() => {
            setDismissed(getLocalStorageItem(STREAK_PROMPT_DISMISSED_KEY) === "1");
        });
    }, []);

    const dismiss = () => {
        setDismissed(true);
        setLocalStorageItem(STREAK_PROMPT_DISMISSED_KEY, "1");
    };

    // Only nudge when there's a streak to protect and permission is untouched.
    const shouldShow = !dismissed && habit.streak > 0 && status === "prompt";

    return (
        <AnimatePresence>
            {shouldShow && (
                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.22 }}
                    className={cn(
                        "glass-surface relative flex items-start gap-3 rounded-2xl p-4",
                        className,
                    )}
                >
                    <button
                        type="button"
                        onClick={dismiss}
                        className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Dismiss"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Bell className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1 pr-4">
                        <p className="font-semibold text-foreground">
                            Keep your {habit.streak}-day streak
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">
                            Turn on a daily reminder so you never forget to practice.
                        </p>
                        <div className="mt-3 flex gap-2">
                            <Button size="sm" onClick={() => enable()} disabled={isBusy}>
                                Turn on
                            </Button>
                            <Button size="sm" variant="ghost" onClick={dismiss}>
                                Not now
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
