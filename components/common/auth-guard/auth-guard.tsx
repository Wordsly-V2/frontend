"use client";

import { useUser } from "@/hooks/useUser.hook";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSection from "../loading-section/loading-section";

interface AuthGuardProps {
    children: React.ReactNode;
}

export default function AuthGuard({ children }: Readonly<AuthGuardProps>) {
    const router = useRouter();
    const pathname = usePathname();
    const { profile, isLoading } = useUser();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            // Don't check auth on auth pages
            if (pathname?.startsWith('/auth')) {
                setIsChecking(false);
                return;
            }

            // Wait for profile to load
            if (isLoading) {
                return;
            }

            // If no profile and not loading, redirect to login
            if (!profile && !isLoading) {
                const loginUrl = `/auth/login`;
                router.push(loginUrl);
                return;
            }

            // Profile loaded, allow access
            if (profile) {
                setIsChecking(false);
            }
        };

        checkAuth();
    }, [profile, isLoading, pathname, router]);

    // Show loading while checking authentication
    if (isChecking || isLoading) {
        return (
            <LoadingSection isLoading={isChecking || isLoading} error={null} refetch={() => {}} loadingLabel="Checking authentication..." />
        );
    }

    // User is authenticated, render children
    return <>{children}</>;
}
