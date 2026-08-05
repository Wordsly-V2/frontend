"use client";

import { CopyField } from "@/components/common/copy-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    type InstallBrowser,
    type InstallPlatform,
    useInstallPrompt,
} from "@/hooks/use-install-prompt";
import {
    BellRing,
    CheckCircle2,
    Download,
    HelpCircle,
    MonitorDown,
    Rocket,
    Share,
    Smartphone,
    WifiOff,
} from "lucide-react";
import { useState } from "react";

const BENEFITS = [
    { icon: Rocket, label: "Opens instantly", hint: "No browser, no tabs — just practice." },
    { icon: WifiOff, label: "Works offline", hint: "Keep learning with a weak connection." },
    { icon: BellRing, label: "Streak reminders", hint: "Daily nudges land on your device." },
] as const;

/** Short, friendly manual steps for browsers with no native install prompt. */
function manualSteps(platform: InstallPlatform, browser: InstallBrowser): string[] | null {
    if (platform === "ios") {
        return [
            "Tap the Share button in the browser bar.",
            "Choose “Add to Home Screen”.",
            "Tap “Add” — Wordsly appears with your apps.",
        ];
    }
    if (platform === "android") {
        if (browser === "firefox") {
            return ["Open the ⋮ menu.", "Tap “Install” or “Add to Home screen”."];
        }
        if (browser === "samsung") {
            return ["Open the ☰ menu.", "Tap “Add page to” → “Home screen”."];
        }
        return ["Open the ⋮ menu.", "Tap “Add to Home screen” → “Install”."];
    }
    if (browser === "chromium") {
        return [
            "Look for the install icon in the address bar.",
            "Or open the ⋮ menu → “Install Wordsly”.",
        ];
    }
    if (browser === "safari") {
        return ["Open the Share menu.", "Choose “Add to Dock”."];
    }
    // Firefox desktop and anything unknown can't install a PWA.
    return null;
}

/**
 * Profile section for installing Wordsly as an app. Always visible (unlike the
 * dismissible floating `InstallPrompt`) so learners can install whenever they
 * decide to: it fires the native prompt when the browser offers one, and falls
 * back to per-platform "Add to Home Screen" steps when it doesn't.
 */
export function InstallAppCard() {
    const {
        isInstalled,
        hasNativePrompt,
        platform,
        browser,
        manageAppsUrl,
        isReady,
        promptInstall,
    } = useInstallPrompt();
    const [isPrompting, setIsPrompting] = useState(false);
    const [declined, setDeclined] = useState(false);

    const handleInstall = async () => {
        setIsPrompting(true);
        try {
            const outcome = await promptInstall();
            if (outcome === "dismissed") setDeclined(true);
        } finally {
            setIsPrompting(false);
        }
    };

    const steps = manualSteps(platform, browser);
    const PlatformIcon = platform === "desktop" ? MonitorDown : Smartphone;

    return (
        <Card className="border-border/80 shadow-md">
            <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                    <PlatformIcon
                        className={isInstalled ? "h-5 w-5 text-[var(--brand-success)]" : "h-5 w-5 text-primary"}
                        aria-hidden
                    />
                    Install the app
                    {isReady && isInstalled && (
                        <Badge variant="success" className="gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                            Installed
                        </Badge>
                    )}
                </CardTitle>
                <CardDescription>
                    {isInstalled
                        ? "Nice — you’re practicing in the Wordsly app."
                        : "Add Wordsly to your device and practice like a real app."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                <ul className="grid gap-3 sm:grid-cols-3">
                    {BENEFITS.map(({ icon: Icon, label, hint }) => (
                        <li key={label} className="flex gap-3 sm:flex-col sm:gap-2">
                            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Icon className="h-4.5 w-4.5" aria-hidden />
                            </span>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground">{label}</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>
                            </div>
                        </li>
                    ))}
                </ul>

                {isReady && !isInstalled && (
                    <div className="space-y-4" aria-live="polite">
                        {hasNativePrompt ? (
                            <>
                                <Button
                                    onClick={handleInstall}
                                    disabled={isPrompting}
                                    className="w-full sm:w-auto"
                                >
                                    <Download className="h-4 w-4" aria-hidden />
                                    {isPrompting ? "Installing…" : "Install Wordsly"}
                                </Button>
                                {declined && (
                                    <p className="text-sm text-muted-foreground">
                                        No problem — you can install any time from here.
                                    </p>
                                )}
                            </>
                        ) : steps ? (
                            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 dark:bg-primary/10">
                                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                                    {platform === "ios" && (
                                        <Share className="h-4 w-4 text-primary" aria-hidden />
                                    )}
                                    How to install
                                </p>
                                <ol className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                                    {steps.map((step, index) => (
                                        <li key={step} className="flex gap-2 leading-relaxed">
                                            <span className="font-semibold text-primary">{index + 1}.</span>
                                            <span>{step}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                This browser can’t install apps yet. Open Wordsly in Chrome, Edge, or
                                Safari to add it to your device.
                            </p>
                        )}

                        {manageAppsUrl && !hasNativePrompt && (
                            <details className="group rounded-2xl border border-border/70 bg-muted/30 p-4">
                                <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
                                    <HelpCircle className="h-4 w-4 text-muted-foreground" aria-hidden />
                                    No install button? It may still be installed here
                                </summary>
                                <div className="mt-3 space-y-3">
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        If you deleted Wordsly from your device, your browser can still
                                        think it&rsquo;s installed and hides the install button. Paste this
                                        in the address bar, remove Wordsly from the list, then reload this
                                        page.
                                    </p>
                                    <CopyField
                                        value={manageAppsUrl}
                                        copyLabel="Copy link"
                                        successMessage={`Copied ${manageAppsUrl} — paste it in the address bar`}
                                    />
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Browsers block links to internal pages, so it has to be pasted by
                                        hand.
                                    </p>
                                </div>
                            </details>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
