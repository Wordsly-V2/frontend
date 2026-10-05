"use client";

import { AppSidebar } from "@/components/common/app-nav/app-sidebar";
import { BottomTabBar } from "@/components/common/app-nav/bottom-tab-bar";
import { MobileTopBar } from "@/components/common/app-nav/mobile-top-bar";
import { PublicHeader } from "@/components/common/app-nav/public-header";
import OfflineBanner from "@/components/common/offline/offline-banner";
import WakingBanner from "@/components/common/service-health-monitor/waking-banner";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed.hook";
import { useUser } from "@/hooks/useUser.hook";
import { appChromeFor, prefersCollapsedSidebar } from "@/lib/app-nav";
import { getBootUserLoginId } from "@/lib/offline/auth-session";
import { usePathname } from "next/navigation";
import { type CSSProperties, type ReactNode, useSyncExternalStore } from "react";

const SIDEBAR_WIDTH = "16rem";
const RAIL_WIDTH = "4.75rem";

const subscribeToNothing = () => () => {};
const getNoBootUser = (): string | null => null;

/**
 * The app frame around every page. Picks the chrome from the path
 * (`appChromeFor`) and the session:
 * - sessions, lessons, tests, onboarding and sign-in get none;
 * - signed-out visitors get the public header;
 * - everyone else gets the sidebar (lg+) or the top bar + tab bar (below lg).
 *
 * While the profile loads, the last confirmed identity on this device decides,
 * so a returning learner never sees the frame pop in after the first paint.
 */
export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
    const pathname = usePathname() ?? "";
    const { profile, isLoading } = useUser();
    const bootUserId = useSyncExternalStore(subscribeToNothing, getBootUserLoginId, getNoBootUser);
    const { collapsed: userCollapsed, setCollapsed } = useSidebarCollapsed();

    const chrome = appChromeFor(pathname);
    const banners = (
        <>
            <OfflineBanner />
            <WakingBanner />
        </>
    );

    if (chrome !== "app") {
        return (
            <>
                {banners}
                {children}
            </>
        );
    }

    const signedIn = !!profile || (isLoading && !!bootUserId);
    if (!signedIn) {
        return (
            <>
                <PublicHeader />
                {banners}
                {children}
            </>
        );
    }

    const forcedCollapsed = prefersCollapsedSidebar(pathname);
    const collapsed = forcedCollapsed || userCollapsed;

    return (
        <div style={{ "--app-sidebar-w": collapsed ? RAIL_WIDTH : SIDEBAR_WIDTH } as CSSProperties}>
            <AppSidebar
                collapsed={collapsed}
                canToggle={!forcedCollapsed}
                onToggle={() => setCollapsed(!userCollapsed)}
            />
            <div className="min-h-dvh transition-[padding] duration-200 motion-reduce:transition-none lg:pl-[var(--app-sidebar-w)]">
                {/* One sticky stack, so the banners slide under the top bar
                    instead of both pinning themselves to top: 0. */}
                <div className="sticky top-0 z-40">
                    <MobileTopBar />
                    {banners}
                </div>
                {children}
                {profile && <BottomTabBar />}
            </div>
        </div>
    );
}
