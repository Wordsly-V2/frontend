import { z } from "zod";

export const courseFormSchema = z.object({
    name: z.string().trim().min(1, "Course name is required"),
    coverImageUrl: z.string().trim(),
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;
