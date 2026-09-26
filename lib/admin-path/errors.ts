import { ApiError } from "@/lib/api-error";

/**
 * The messages to show for a failed admin call: the server's `errors` list
 * (validation) when it sent one, else its message.
 */
export function adminErrorMessages(error: unknown): string[] {
    if (error instanceof ApiError) {
        const data = error.data as { errors?: unknown } | undefined;
        if (Array.isArray(data?.errors) && data.errors.every((e) => typeof e === "string")) {
            return [error.message, ...data.errors];
        }
        return [error.message];
    }
    return [error instanceof Error ? error.message : "Something went wrong."];
}
