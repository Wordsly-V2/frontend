import { z } from "zod";

export const lessonFormSchema = z.object({
    name: z.string().trim().min(1, "Lesson name is required"),
    coverImageUrl: z.string().trim(),
    // Kept as a raw string in the form; coerced to number | null on submit.
    maxWords: z
        .string()
        .trim()
        .refine((v) => v === "" || Number.parseInt(v, 10) >= 1, "Must be at least 1"),
});

export type LessonFormValues = z.infer<typeof lessonFormSchema>;
