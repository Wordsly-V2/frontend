"use client";

import { FormDialog } from "@/components/common/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lessonFormSchema, type LessonFormValues } from "@/lib/schemas/lesson.schema";
import { ILesson } from "@/types/courses/courses.type";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

interface LessonFormDialogProps {
    isLoading: boolean;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (lesson: Omit<ILesson, 'id' | 'courseId' | 'createdAt' | 'updatedAt' | 'words' | 'orderIndex' | 'wordProgressStats' | 'maxWords' | 'coverImageUrl'> & { maxWords?: number | null; coverImageUrl?: string | null }) => void;
    lesson?: ILesson;
    title: string;
}

export default function LessonFormDialog({
    isLoading,
    isOpen,
    onClose,
    onSubmit,
    lesson,
    title,
}: Readonly<LessonFormDialogProps>) {
    const { register, handleSubmit, reset, control, formState } = useForm<LessonFormValues>({
        resolver: zodResolver(lessonFormSchema),
        defaultValues: { name: "", coverImageUrl: "", maxWords: "" },
    });

    useEffect(() => {
        reset({
            name: lesson?.name ?? "",
            coverImageUrl: lesson?.coverImageUrl ?? "",
            maxWords: lesson?.maxWords?.toString() ?? "",
        });
    }, [lesson, isOpen, reset]);

    const coverImageUrl = useWatch({ control, name: "coverImageUrl" });

    const submit = handleSubmit((values) => {
        const maxWordsValue = values.maxWords.trim();
        onSubmit({
            name: values.name.trim(),
            coverImageUrl: values.coverImageUrl.trim() || null,
            maxWords: maxWordsValue ? Number.parseInt(maxWordsValue, 10) : null,
        });
    });

    return (
        <FormDialog
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            onSubmit={submit}
            submitLabel={lesson ? "Update Lesson" : "Create Lesson"}
            isLoading={isLoading}
        >
            <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">
                    Lesson Name <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="name"
                    placeholder="e.g., Greetings & Introductions"
                    className="text-sm sm:text-base"
                    {...register("name")}
                />
                {formState.errors.name && (
                    <p className="text-xs text-destructive">{formState.errors.name.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="maxWords" className="text-sm">
                    Max Words
                </Label>
                <Input
                    id="maxWords"
                    type="number"
                    min="1"
                    placeholder="No limit"
                    className="text-sm sm:text-base"
                    {...register("maxWords")}
                />
                {formState.errors.maxWords ? (
                    <p className="text-xs text-destructive">{formState.errors.maxWords.message}</p>
                ) : (
                    <p className="text-xs text-muted-foreground">
                        Leave empty for no limit. Set a number to cap vocabulary words in this lesson.
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="coverImageUrl" className="text-sm">
                    Cover Image URL
                </Label>
                <Input
                    id="coverImageUrl"
                    type="url"
                    placeholder="https://..."
                    className="text-sm sm:text-base"
                    {...register("coverImageUrl")}
                />
                {coverImageUrl && (
                    <div className="mt-2 sm:mt-3 space-y-2">
                        <p className="text-xs text-muted-foreground">Image Preview:</p>
                        <div className="relative w-full h-32 sm:h-40 rounded-lg border-2 border-border overflow-hidden bg-muted">
                            <Image
                                src={coverImageUrl}
                                alt="Cover preview"
                                fill
                                loading="lazy"
                                className="object-cover"
                                onError={(e) => {
                                    const target = e.currentTarget;
                                    target.style.display = "none";
                                    const parent = target.parentElement;
                                    if (parent && !parent.querySelector(".error-placeholder")) {
                                        const placeholder = document.createElement("div");
                                        placeholder.className =
                                            "error-placeholder absolute inset-0 flex items-center justify-center flex-col gap-2 text-muted-foreground";
                                        placeholder.innerHTML =
                                            '<svg class="h-10 w-10 sm:h-12 sm:w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="text-xs">Invalid image URL</p>';
                                        parent.appendChild(placeholder);
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </FormDialog>
    );
}
