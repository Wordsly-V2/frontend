"use client";

import { ImportWordsScreen } from "@/components/features/manage/import-words/import-words-screen";
import { use } from "react";

export default function ImportWordsPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
    const { id } = use(params);
    return <ImportWordsScreen courseId={id} />;
}
