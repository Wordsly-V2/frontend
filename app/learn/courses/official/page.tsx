"use client";

import { BackLink } from "@/components/common/back-link/back-link";
import { PageHeader, PageShell } from "@/components/common/page";
import { OfficialCoursesCatalogue } from "@/components/features/courses/official-courses-catalogue";

export default function OfficialCoursesPage() {
    return (
        <PageShell>
            <PageHeader
                back={<BackLink href="/learn/courses">Your courses</BackLink>}
                eyebrow="Library"
                title="Wordsly courses"
                description="Ready-made courses from the Wordsly team. Add one to your library and study it like your own."
            />
            <OfficialCoursesCatalogue />
        </PageShell>
    );
}
