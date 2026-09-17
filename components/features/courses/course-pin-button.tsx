"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSetMyCoursePinMutation } from "@/queries/courses.query";
import { Pin } from "lucide-react";
import { toast } from "sonner";

interface CoursePinButtonProps {
    courseId: string;
    courseName: string;
    isPinned: boolean;
    className?: string;
}

/**
 * Pin/unpin toggle for a course card. The card itself is a link, so the click
 * is stopped here — pinning must never navigate into the course.
 */
export default function CoursePinButton({
    courseId,
    courseName,
    isPinned,
    className,
}: Readonly<CoursePinButtonProps>) {
    const { mutate: setPin, isPending } = useSetMyCoursePinMutation();

    const handleClick = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        if (isPending) return;

        setPin(
            { courseId, pinned: !isPinned },
            {
                onSuccess: () =>
                    toast.success(
                        isPinned
                            ? `“${courseName}” unpinned`
                            : `“${courseName}” pinned to the top`,
                    ),
                onError: (error: Error) =>
                    toast.error(
                        `Couldn't ${isPinned ? "unpin" : "pin"} this course: ` +
                            (error?.message ?? "Unknown error"),
                    ),
            },
        );
    };

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-pressed={isPinned}
            aria-label={isPinned ? `Unpin ${courseName}` : `Pin ${courseName}`}
            title={isPinned ? "Unpin" : "Pin to top"}
            disabled={isPending}
            onClick={handleClick}
            className={cn(
                "rounded-full bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background",
                isPinned ? "text-primary" : "text-muted-foreground",
                className,
            )}
        >
            <Pin
                className={cn("h-4 w-4", isPinned && "fill-current")}
                aria-hidden
            />
        </Button>
    );
}
