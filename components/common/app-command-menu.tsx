"use client";

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";
import { useNextPracticeAction } from "@/hooks/useNextPracticeAction.hook";
import { useUser } from "@/hooks/useUser.hook";
import {
    BarChart3,
    BookOpen,
    Dumbbell,
    GraduationCap,
    Home,
    Library,
    LogIn,
    Sparkles,
    User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type PaletteRoute = {
    href: string;
    label: string;
    icon: typeof Home;
    /** Extra words that should match this page (never shown). */
    keywords?: string[];
};

/** Pages any visitor can reach. */
const PUBLIC_ROUTES: PaletteRoute[] = [
    { href: "/", label: "Home", icon: Home, keywords: ["landing", "start"] },
];

/** Pages that need a signed-in learner. Practice is added separately — its href is dynamic. */
const LEARN_ROUTES: PaletteRoute[] = [
    { href: "/learn", label: "Learn", icon: BookOpen, keywords: ["dashboard", "today", "home"] },
    { href: "/learn/courses", label: "Courses", icon: Library, keywords: ["my courses", "lessons", "words"] },
    {
        href: "/progress",
        label: "Progress",
        icon: BarChart3,
        keywords: ["report", "stats", "statistics", "charts", "accuracy", "streak"],
    },
    {
        href: "/manage",
        label: "Manage courses",
        icon: GraduationCap,
        keywords: ["edit", "add words", "import", "create course"],
    },
    {
        href: "/learn/onboarding",
        label: "Onboarding setup",
        icon: Sparkles,
        keywords: ["goal", "level", "wizard", "get started"],
    },
];

const ACCOUNT_ROUTES: PaletteRoute[] = [
    { href: "/profile", label: "Profile", icon: User, keywords: ["account", "settings", "log out"] },
];

export function AppCommandMenu() {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const { profile } = useUser();
    const nextPractice = useNextPracticeAction();

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((o) => !o);
            }
        };
        const onOpenPalette = () => setOpen(true);
        globalThis.document.addEventListener("keydown", onKeyDown);
        globalThis.document.addEventListener(
            "wordsly:open-command-palette",
            onOpenPalette as EventListener,
        );
        return () => {
            globalThis.document.removeEventListener("keydown", onKeyDown);
            globalThis.document.removeEventListener(
                "wordsly:open-command-palette",
                onOpenPalette as EventListener,
            );
        };
    }, []);

    const go = (href: string) => {
        setOpen(false);
        router.push(href);
    };

    const practice = nextPractice.primary;

    const renderRoute = ({ href, label, icon: Icon, keywords }: PaletteRoute) => (
        <CommandItem
            key={href}
            value={label}
            keywords={keywords}
            className="cursor-pointer"
            onSelect={() => go(href)}
        >
            <Icon className="text-muted-foreground" />
            <span>{label}</span>
        </CommandItem>
    );

    return (
        <CommandDialog open={open} onOpenChange={setOpen} title="Command palette" description="Go to a page">
            <CommandInput placeholder="Search pages…" />
            <CommandList>
                <CommandEmpty>No pages found.</CommandEmpty>
                <CommandGroup heading="Wordsly">{PUBLIC_ROUTES.map(renderRoute)}</CommandGroup>
                {profile && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading="Learn">
                            {/* Same "what's next" resolution as the nav and bottom bar,
                                so this always starts a session with real words. */}
                            {practice && (
                                <CommandItem
                                    value="Practice"
                                    keywords={["review", "study", "session", "flashcards"]}
                                    className="cursor-pointer"
                                    onSelect={() => go(practice.href)}
                                >
                                    <Dumbbell className="text-muted-foreground" />
                                    <span>Practice</span>
                                    <CommandShortcut>{practice.label}</CommandShortcut>
                                </CommandItem>
                            )}
                            {LEARN_ROUTES.map(renderRoute)}
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup heading="Account">{ACCOUNT_ROUTES.map(renderRoute)}</CommandGroup>
                    </>
                )}
                {!profile && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading="Account">
                            {renderRoute({
                                href: "/auth/login",
                                label: "Log in",
                                icon: LogIn,
                                keywords: ["sign in", "sign up", "register", "google"],
                            })}
                        </CommandGroup>
                    </>
                )}
                <CommandSeparator />
                <CommandGroup heading="Shortcuts">
                    <CommandItem onSelect={() => setOpen(false)}>
                        <span className="text-muted-foreground">Close palette</span>
                        <CommandShortcut>Esc</CommandShortcut>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
