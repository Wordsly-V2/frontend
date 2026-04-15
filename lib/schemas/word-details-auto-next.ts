import { z } from "zod";

export const wordDetailsAutoNextSchema = z.object({
    enabled: z.boolean(),
    delaySec: z
        .number()
        .int("Use a whole number")
        .min(1, "At least 1 second")
        .max(600, "At most 600 seconds"),
});

export type WordDetailsAutoNextFormValues = z.infer<typeof wordDetailsAutoNextSchema>;
