'use client';
import { useUserProfile } from "@/hooks/useUser";
import { redirect } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    const { data: userProfile, isLoading } = useUserProfile();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-pink-950/20 p-4">
                <LoadingSpinner size="lg" label="Đang tải thông tin tài khoản…" />
            </div>
        );
    }

    if (userProfile) {
        redirect("/profile");
    }

    return (
        children
    );
}