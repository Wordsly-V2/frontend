"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { courseFormSchema, type CourseFormValues } from "@/lib/schemas/course.schema";
import { markOnboardingDone } from "@/lib/onboarding";
import { cn } from "@/lib/utils";
import { useCreateMyCourseMutation } from "@/queries/courses.query";
import { useUpdateDailyGoalMutation } from "@/queries/daily-habit.query";
import { DAILY_GOAL_OPTIONS } from "@/types/daily-habit/daily-habit.type";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    BarChart3,
    Dumbbell,
    Flame,
    GraduationCap,
    Library,
    Target,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { toast } from "sonner";
import "swiper/css";
import "swiper/css/pagination";

type Step = "goal" | "course" | "tour";
const STEP_ORDER: Step[] = ["goal", "course", "tour"];

const TOUR_SLIDES = [
    {
        icon: Dumbbell,
        title: "Practice a little every day",
        body: "Short, smart sessions mix quizzes and listening so words really stick.",
    },
    {
        icon: Flame,
        title: "Build your streak",
        body: "Hit your daily goal to grow a streak. Miss a day? A streak freeze has your back.",
    },
    {
        icon: BarChart3,
        title: "Watch your progress",
        body: "See words move from new to mastered, and track your XP and levels over time.",
    },
];

export function OnboardingWizard() {
    const router = useRouter();
    const reduceMotion = useReducedMotion();
    const [step, setStep] = useState<Step>("goal");
    const [selectedGoal, setSelectedGoal] = useState<number>(DAILY_GOAL_OPTIONS[1]);

    const updateGoal = useUpdateDailyGoalMutation();
    const createCourse = useCreateMyCourseMutation();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CourseFormValues>({
        resolver: zodResolver(courseFormSchema),
        defaultValues: { name: "", coverImageUrl: "" },
    });

    const stepIndex = STEP_ORDER.indexOf(step);

    const finish = () => {
        markOnboardingDone();
        router.replace("/learn");
    };

    const goToStep = (next: Step) => setStep(next);

    const handleGoalContinue = () => {
        updateGoal.mutate(
            { dailyGoal: selectedGoal },
            { onError: () => toast.error("Couldn't save your goal — you can change it later") },
        );
        goToStep("course");
    };

    const handleCourseSubmit = handleSubmit((values) => {
        createCourse.mutate(
            { name: values.name.trim(), coverImageUrl: values.coverImageUrl.trim() || undefined },
            {
                onSuccess: () => {
                    toast.success("Course created! Add words to it any time.");
                    goToStep("tour");
                },
                onError: (err) => toast.error("Couldn't create course: " + err.message),
            },
        );
    });

    const slideVariants = reduceMotion
        ? undefined
        : {
              enter: { opacity: 0, x: 40 },
              center: { opacity: 1, x: 0 },
              exit: { opacity: 0, x: -40 },
          };

    return (
        <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-8">
            {/* Progress dots */}
            <div className="mb-8 flex items-center justify-center gap-2" aria-hidden>
                {STEP_ORDER.map((s, i) => (
                    <span
                        key={s}
                        className={cn(
                            "h-1.5 rounded-full transition-all",
                            i <= stepIndex ? "w-8 bg-primary" : "w-4 bg-muted",
                        )}
                    />
                ))}
            </div>

            <div className="flex flex-1 flex-col">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={step}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: reduceMotion ? 0 : 0.25 }}
                        className="flex flex-1 flex-col"
                    >
                        {step === "goal" && (
                            <div className="flex flex-1 flex-col">
                                <div className="mb-6 text-center">
                                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand shadow-md shadow-primary/20">
                                        <Target className="h-7 w-7 text-white" />
                                    </div>
                                    <h1 className="font-display text-2xl font-bold">
                                        Set your daily goal
                                    </h1>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        How many words would you like to practice each day?
                                    </p>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {DAILY_GOAL_OPTIONS.map((n) => (
                                        <Button
                                            key={n}
                                            type="button"
                                            variant={selectedGoal === n ? "default" : "outline"}
                                            onClick={() => setSelectedGoal(n)}
                                            className="h-auto flex-col gap-1 rounded-2xl py-4"
                                        >
                                            <span className="text-xl font-bold">{n}</span>
                                            <span className="text-xs font-normal opacity-80">
                                                words
                                            </span>
                                        </Button>
                                    ))}
                                </div>
                                <div className="mt-auto flex flex-col gap-2 pt-8">
                                    <Button
                                        type="button"
                                        size="lg"
                                        onClick={handleGoalContinue}
                                        className="rounded-xl"
                                    >
                                        Continue
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={finish}
                                        className="rounded-xl text-muted-foreground"
                                    >
                                        Skip for now
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === "course" && (
                            <form onSubmit={handleCourseSubmit} className="flex flex-1 flex-col">
                                <div className="mb-6 text-center">
                                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand shadow-md shadow-primary/20">
                                        <Library className="h-7 w-7 text-white" />
                                    </div>
                                    <h1 className="font-display text-2xl font-bold">
                                        Create your first course
                                    </h1>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Courses group the words you want to learn. Give yours a name.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="onboarding-course-name" className="text-sm">
                                        Course name
                                    </Label>
                                    <Input
                                        id="onboarding-course-name"
                                        autoFocus
                                        placeholder="e.g., Everyday English"
                                        {...register("name")}
                                    />
                                    {errors.name && (
                                        <p className="text-xs text-destructive">
                                            {errors.name.message}
                                        </p>
                                    )}
                                </div>
                                <div className="mt-auto flex flex-col gap-2 pt-8">
                                    <Button
                                        type="submit"
                                        size="lg"
                                        disabled={createCourse.isPending}
                                        className="rounded-xl"
                                    >
                                        {createCourse.isPending ? "Creating…" : "Create course"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={finish}
                                        className="rounded-xl text-muted-foreground"
                                    >
                                        Skip for now
                                    </Button>
                                </div>
                            </form>
                        )}

                        {step === "tour" && (
                            <div className="flex flex-1 flex-col">
                                <Swiper
                                    modules={[Pagination]}
                                    pagination={{ clickable: true }}
                                    spaceBetween={24}
                                    slidesPerView={1}
                                    className="w-full"
                                >
                                    {TOUR_SLIDES.map(({ icon: Icon, title, body }) => (
                                        <SwiperSlide key={title}>
                                            <div className="flex flex-col items-center px-2 pb-10 text-center">
                                                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl gradient-brand shadow-md shadow-primary/20">
                                                    <Icon className="h-8 w-8 text-white" />
                                                </div>
                                                <h2 className="font-display text-xl font-bold">
                                                    {title}
                                                </h2>
                                                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                                                    {body}
                                                </p>
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                                <div className="mt-auto flex flex-col gap-2 pt-6">
                                    <Button
                                        type="button"
                                        size="lg"
                                        onClick={finish}
                                        className="gap-2 rounded-xl"
                                    >
                                        <GraduationCap className="h-5 w-5" />
                                        Start learning
                                    </Button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
