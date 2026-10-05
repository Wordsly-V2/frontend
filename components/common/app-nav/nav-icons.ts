import type { AppNavKey } from "@/lib/app-nav";
import { BarChart3, BookOpen, Library, type LucideIcon, Route, Settings } from "lucide-react";

export const APP_NAV_ICONS: Record<AppNavKey, LucideIcon> = {
    learn: BookOpen,
    path: Route,
    courses: Library,
    progress: BarChart3,
    manage: Settings,
};

/** The command palette listens for this; the ⌘K shortcut is wired there. */
export function openCommandPalette() {
    globalThis.document.dispatchEvent(new Event("wordsly:open-command-palette"));
}
