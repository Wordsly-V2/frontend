import { Button } from "@/components/ui/button";
import { wordCount } from "@/lib/word-import-review";
import { BookOpen, FileUp, PartyPopper } from "lucide-react";
import Link from "next/link";

/** Step 3: what went in, what didn't, and where to go next. */
export function ImportDoneStep({
    added,
    leftOut,
    lessonName,
    lessonHref,
    onImportMore,
}: Readonly<{ added: number; leftOut: number; lessonName: string; lessonHref: string; onImportMore: () => void }>) {
    return (
        <section className="surface-card flex flex-col items-center px-6 py-12 text-center sm:py-16" aria-live="polite">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/12 text-primary">
                <PartyPopper className="h-8 w-8" aria-hidden />
            </span>
            <h2 className="mt-5 font-display text-2xl font-bold tracking-tight">
                {wordCount(added)} added to {lessonName}
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {leftOut > 0
                    ? `${wordCount(leftOut)} ${leftOut === 1 ? "was" : "were"} left out. You can add ${leftOut === 1 ? "it" : "them"} later.`
                    : "They're ready to practice."}
            </p>
            <div className="mt-8 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button asChild size="lg">
                    <Link href={lessonHref}>
                        <BookOpen className="h-4 w-4" aria-hidden />
                        See the lesson
                    </Link>
                </Button>
                <Button variant="outline" size="lg" onClick={onImportMore}>
                    <FileUp className="h-4 w-4" aria-hidden />
                    Import more
                </Button>
            </div>
        </section>
    );
}
