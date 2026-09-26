import { AdminDashboard } from "@/components/features/admin/admin-dashboard";

export default function AdminPage() {
    return (
        <main className="min-h-dvh px-4 pb-24 pt-6 md:px-8 md:pt-10">
            <div className="mx-auto max-w-5xl">
                <AdminDashboard />
            </div>
        </main>
    );
}
