import AuthGuard from "@/components/common/auth-guard/auth-guard";
import { AdminGate } from "@/components/features/admin-path/admin-gate";

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <AuthGuard>
            <AdminGate>{children}</AdminGate>
        </AuthGuard>
    );
}
