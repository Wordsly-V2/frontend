import { PageShell } from "@/components/common/page";
import { PathOverview } from "@/components/features/path/path-overview";

export default function PathPage() {
    return (
        <PageShell width="default">
            <div>
                <PathOverview />
            </div>
        </PageShell>
    );
}
