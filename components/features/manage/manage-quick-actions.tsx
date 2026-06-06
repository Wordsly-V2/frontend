"use client";

import { Button } from "@/components/ui/button";
import { getLastManageCourse } from "@/lib/manage-session";
import { BookOpen, FolderOpen, PenLine, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

interface ManageQuickActionsProps {
    onCreateCourse: () => void;
}

export function ManageQuickActions({ onCreateCourse }: Readonly<ManageQuickActionsProps>) {
    const router = useRouter();
    const pathname = usePathname();
    const [last, setLast] = useState<ReturnType<typeof getLastManageCourse>>(null);

    useEffect(() => {
        startTransition(() => {
            setLast(getLastManageCourse());
        });
    }, [pathname]);

    const subtitle = last
        ? `Pick up "${last.name}" or start something new.`
        : "Create a course, add lessons and words, then study in Learn.";

    return (
        <nav
            aria-label="Quick manage actions"
            className="mb-6 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm sm:p-5"
        >
            <div className="flex min-w-0 flex-col gap-4">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Next step
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                </div>

                <div className="flex min-w-0 w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                    <Button
                        type="button"
                        className="w-full rounded-xl gap-2 sm:w-auto"
                        onClick={onCreateCourse}
                    >
                        <Plus className="h-4 w-4" aria-hidden />
                        New course
                    </Button>
                    {last ? (
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full rounded-xl gap-2 border-primary/25 sm:w-auto"
                            onClick={() => router.push(`/manage/courses/${last.id}`)}
                        >
                            <PenLine className="h-4 w-4" aria-hidden />
                            <span className="truncate">Continue editing</span>
                        </Button>
                    ) : null}
                    <Button variant="secondary" className="w-full rounded-xl gap-2 sm:w-auto" asChild>
                        <a href="#course-library">
                            <FolderOpen className="h-4 w-4" aria-hidden />
                            Browse library
                        </a>
                    </Button>
                    <Button variant="outline" className="w-full rounded-xl gap-2 sm:w-auto" asChild>
                        <Link href="/learn">
                            <BookOpen className="h-4 w-4" aria-hidden />
                            Open Learn
                        </Link>
                    </Button>
                </div>
            </div>
        </nav>
    );
}
