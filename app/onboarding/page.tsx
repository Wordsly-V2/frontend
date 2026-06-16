"use client";

import { OnboardingGoalStep } from "@/components/features/onboarding/onboarding-goal-step";
import { OnboardingLevelStep } from "@/components/features/onboarding/onboarding-level-step";
import { OnboardingStartStep } from "@/components/features/onboarding/onboarding-start-step";
import { Button } from "@/components/ui/button";
import { useNextPracticeAction } from "@/hooks/useNextPracticeAction.hook";
import {
    completeOnboarding,
    patchOnboarding,
    type OnboardingLevel,
} from "@/lib/onboarding";
import { cn } from "@/lib/utils";
import { useGetMyCoursesQuery } from "@/queries/courses.query";
import { useUpdateDailyGoalMutation } from "@/queries/daily-habit.query";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const STEPS = 3;

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [goal, setGoal] = useState<number | undefined>(10);
    const [level, setLevel] = useState<OnboardingLevel | undefined>("B1");
    const [starting, setStarting] = useState(false);

    const updateGoal = useUpdateDailyGoalMutation();
    const next = useNextPracticeAction();
    const { data: courses } = useGetMyCoursesQuery(1, 1, "name", "asc", "");
    const hasCourses = (courses?.totalItems ?? 0) > 0;

    const finish = (destination: string) => {
        completeOnboarding({ goal, level });
        router.replace(destination);
    };

    const handleNext = () => {
        if (step === 0 && goal) {
            updateGoal.mutate({ dailyGoal: goal });
            patchOnboarding({ goal });
        }
        if (step === 1) patchOnboarding({ level });
        setStep((s) => Math.min(STEPS - 1, s + 1));
    };

    const handleStart = () => {
        setStarting(true);
        const destination = hasCourses
            ? (next.primary?.href ?? "/learn")
            : "/learn/courses";
        finish(destination);
    };

    return (
        <main className="mesh-page-bg flex min-h-dvh flex-col px-4 py-6">
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
                {/* Progress dots + skip */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex gap-1.5" aria-hidden>
                        {Array.from({ length: STEPS }).map((_, i) => (
                            <span
                                key={i}
                                className={cn(
                                    "h-2 rounded-full transition-all",
                                    i === step
                                        ? "w-8 bg-primary"
                                        : i < step
                                          ? "w-2 bg-primary/50"
                                          : "w-2 bg-muted",
                                )}
                            />
                        ))}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => finish("/learn")}
                    >
                        Skip
                    </Button>
                </div>

                <div className="flex flex-1 flex-col justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.25 }}
                        >
                            {step === 0 && (
                                <OnboardingGoalStep
                                    value={goal}
                                    onChange={setGoal}
                                />
                            )}
                            {step === 1 && (
                                <OnboardingLevelStep
                                    value={level}
                                    onChange={setLevel}
                                />
                            )}
                            {step === 2 && (
                                <OnboardingStartStep
                                    hasCourses={hasCourses}
                                    goal={goal}
                                    onStart={handleStart}
                                    starting={starting}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer controls */}
                <div className="mt-8 flex items-center justify-between gap-3">
                    {step > 0 ? (
                        <Button
                            variant="ghost"
                            onClick={() => setStep((s) => s - 1)}
                        >
                            Back
                        </Button>
                    ) : (
                        <span />
                    )}
                    {step < STEPS - 1 && (
                        <Button variant="play" size="lg" onClick={handleNext}>
                            Continue
                        </Button>
                    )}
                </div>
            </div>
        </main>
    );
}
