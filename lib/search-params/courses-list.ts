import { parseAsInteger, parseAsString } from "nuqs/server";

export const coursesListSearchParams = {
    q: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
};
