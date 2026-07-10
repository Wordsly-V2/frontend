import { BookMarked, Layers, TrendingUp } from "lucide-react";

const STEPS = [
    {
        icon: BookMarked,
        chip: "gradient-brand",
        title: "Build your library",
        body: "Create courses and lessons with the words you actually need — with IPA, audio, and meanings.",
    },
    {
        icon: Layers,
        chip: "gradient-accent",
        title: "Practice in five modes",
        body: "Flashcards, in-context typing, listening, word bank, and fill-in — the same word, five angles.",
    },
    {
        icon: TrendingUp,
        chip: "gradient-success",
        title: "Let the algorithm remember",
        body: "FSRS schedules each review right before you forget, so every session counts.",
    },
] as const;

export function HowItWorks() {
    return (
        <section className="border-y border-border/40 bg-muted/25 py-14 sm:py-16 dark:bg-muted/10">
            <div className="container mx-auto max-w-6xl px-4 sm:px-6">
                <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
                    How it works
                </h2>
                <p className="mx-auto mt-2 max-w-lg text-center text-sm text-muted-foreground sm:text-base">
                    Three simple loops — build, practice, remember.
                </p>
                <div className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-6">
                    {STEPS.map((step, index) => (
                        <div
                            key={step.title}
                            className="relative flex flex-col items-center text-center"
                        >
                            <div
                                className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${step.chip} shadow-md`}
                            >
                                <step.icon className="h-7 w-7 text-white" aria-hidden />
                            </div>
                            <span className="mb-1 text-xs font-extrabold uppercase tracking-widest text-primary">
                                Step {index + 1}
                            </span>
                            <h3 className="font-bold">{step.title}</h3>
                            <p className="mt-2 text-sm text-muted-foreground text-balance">
                                {step.body}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
