import AuthGuard from "@/components/common/auth-guard/auth-guard";
import { AdminShell } from "@/components/features/admin/admin-shell";
import { AdminGate } from "@/components/features/admin-path/admin-gate";

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <AuthGuard>
            <AdminGate>
                <AdminShell>{children}</AdminShell>
            </AdminGate>
        </AuthGuard>
    );
}
