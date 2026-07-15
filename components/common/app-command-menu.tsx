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
import { DictionaryLookupDialog } from "@/components/features/dictionary/dictionary-lookup-dialog";
import { useUser } from "@/hooks/useUser.hook";
import {
    BookOpen,
    GraduationCap,
    Home,
    LayoutDashboard,
    Search,
    User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AppCommandMenu() {
    const [open, setOpen] = useState(false);
    const [lookupOpen, setLookupOpen] = useState(false);
    const router = useRouter();
    const { profile } = useUser();

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

    const openLookup = () => {
        setOpen(false);
        setLookupOpen(true);
    };

    return (
        <>
        <CommandDialog open={open} onOpenChange={setOpen} title="Command palette" description="Go to a page">
            <CommandInput placeholder="Search pages…" />
            <CommandList>
                <CommandEmpty>No pages found.</CommandEmpty>
                <CommandGroup heading="Wordsly">
                    <CommandItem
                        className="cursor-pointer"
                        onSelect={() => go("/")}
                    >
                        <Home className="text-muted-foreground" />
                        <span>Home</span>
                    </CommandItem>
                </CommandGroup>
                {profile && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading="Learn">
                            <CommandItem
                                className="cursor-pointer"
                                onSelect={() => go("/learn")}
                            >
                                <BookOpen className="text-muted-foreground" />
                                <span>Learn</span>
                            </CommandItem>
                            <CommandItem
                                className="cursor-pointer"
                                onSelect={() => go("/manage")}
                            >
                                <GraduationCap className="text-muted-foreground" />
                                <span>Manage courses</span>
                            </CommandItem>
                            <CommandItem
                                className="cursor-pointer"
                                onSelect={openLookup}
                            >
                                <Search className="text-muted-foreground" />
                                <span>Look up a word</span>
                            </CommandItem>
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup heading="Account">
                            <CommandItem
                                className="cursor-pointer"
                                onSelect={() => go("/profile")}
                            >
                                <User className="text-muted-foreground" />
                                <span>Profile</span>
                            </CommandItem>
                        </CommandGroup>
                    </>
                )}
                {!profile && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading="Account">
                            <CommandItem
                                className="cursor-pointer"
                                onSelect={() => go("/auth/login")}
                            >
                                <LayoutDashboard className="text-muted-foreground" />
                                <span>Log in</span>
                            </CommandItem>
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
        {profile && (
            <DictionaryLookupDialog open={lookupOpen} onOpenChange={setLookupOpen} />
        )}
        </>
    );
}
