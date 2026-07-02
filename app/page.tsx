"use client";

import { FeatureBento } from "@/components/features/home/feature-bento";
import { HomeWelcomeBanner } from "@/components/features/home/home-welcome-banner";
import { HowItWorks } from "@/components/features/home/how-it-works";
import { LandingHero } from "@/components/features/home/landing-hero";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser.hook";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
    const { profile } = useUser();

    return (
        <main className="min-h-dvh">
            {profile && (
                <div className="container mx-auto max-w-6xl px-4 pt-6 sm:px-6">
                    <HomeWelcomeBanner
                        displayName={profile.displayName ?? "Learner"}
                    />
                </div>
            )}

            <LandingHero signedIn={!!profile} />

            <HowItWorks />

            <FeatureBento />

            {/* Closing CTA */}
            <section className="pb-16 pt-2 sm:pb-20">
                <div className="container mx-auto max-w-6xl px-4 sm:px-6">
                    <div className="relative overflow-hidden rounded-3xl gradient-hero px-6 py-12 text-center shadow-xl sm:px-12 sm:py-14">
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_-20%,rgba(255,255,255,0.25),transparent_60%)]"
                        />
                        <h2 className="relative text-2xl font-bold text-white sm:text-3xl">
                            Two minutes is enough to keep a word.
                        </h2>
                        <p className="relative mx-auto mt-3 max-w-md text-white/85">
                            Open Learn, clear today&apos;s reviews, and let FSRS handle
                            the rest.
                        </p>
                        <Button
                            size="xl"
                            className="relative mt-7 bg-white font-extrabold uppercase tracking-wide text-primary shadow-lg hover:bg-white/90"
                            asChild
                        >
                            <Link href="/learn">
                                Go to Learn
                                <ArrowRight className="h-4 w-4" aria-hidden />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>
        </main>
    );
}
