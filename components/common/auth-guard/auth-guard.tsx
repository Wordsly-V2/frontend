"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/hooks/useUser.hook";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
                <div className="text-center space-y-4">
                    <LoadingSpinner size="lg" label="Checking authentication..." />
                </div>
            </div>
        );
    }

    // User is authenticated, render children
    return <>{children}</>;
}
