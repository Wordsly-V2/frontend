import { PathOverview } from "@/components/features/path/path-overview";

export default function PathPage() {
    return (
        <main className="min-h-dvh px-4 pb-24 pt-6 md:px-8 md:pb-12 md:pt-10">
            <div className="mx-auto max-w-3xl">
                <PathOverview />
            </div>
        </main>
    );
}
