"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
	BookOpen,
	Settings,
	GraduationCap,
	Sparkles,
	ArrowRight,
	BookMarked,
	Mic2,
	BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useUser } from "@/hooks/useUser.hook";

export default function HomePage() {
	const router = useRouter();
	const { profile } = useUser();

	return (
		<main className="min-h-dvh">
			{/* Hero — asymmetric: copy + visual panel */}
			<section className="relative overflow-hidden border-b border-border/50">
				<div className="container relative mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
					<div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:items-center">
						<div>
							<p className="mb-3 inline-flex items-center rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
								Vocabulary · A2–C1
							</p>
							<h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
								<span className="bg-gradient-to-br from-foreground via-foreground to-primary bg-clip-text text-transparent">
									Learn words that stick.
								</span>
							</h1>
							<p className="mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
								Short sessions, clear progress, and practice built for real life — on
								phone or desktop.
							</p>
							<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
								<Button
									size="lg"
									onClick={() => router.push("/learn")}
									className="h-12 w-full rounded-xl px-8 text-base gradient-brand text-white shadow-lg shadow-primary/20 sm:w-auto"
								>
									<BookOpen className="h-5 w-5" aria-hidden />
									Start learning
								</Button>
								<Button
									size="lg"
									variant="outline"
									onClick={() => router.push("/manage")}
									className="h-12 w-full rounded-xl px-8 text-base sm:w-auto"
								>
									<Settings className="h-5 w-5" aria-hidden />
									Manage courses
								</Button>
							</div>
							{!profile && (
								<p className="mt-6 text-sm text-muted-foreground">
									New here?{" "}
									<Link
										href="/auth/login"
										className="font-medium text-primary underline-offset-4 hover:underline"
									>
										Sign in
									</Link>{" "}
									to sync progress.
								</p>
							)}
						</div>

						<div className="relative lg:min-h-[280px]">
							<div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/15 via-transparent to-[var(--brand-accent)]/15 blur-2xl lg:-inset-6" />
							<div className="relative flex h-full min-h-[240px] flex-col justify-between rounded-3xl border border-border/60 bg-card/90 p-6 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.2)] backdrop-blur-sm dark:bg-card/80 dark:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.5)] sm:p-8">
								<div className="flex items-start justify-between gap-4">
									<div className="rounded-2xl gradient-brand p-3 shadow-md">
										<GraduationCap className="h-8 w-8 text-white" aria-hidden />
									</div>
									<span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
										Daily habit
									</span>
								</div>
								<div className="space-y-3">
									<div className="flex items-center gap-3 rounded-2xl bg-muted/60 px-4 py-3 dark:bg-muted/30">
										<Sparkles className="h-5 w-5 shrink-0 text-primary" aria-hidden />
										<div>
											<p className="text-sm font-medium">Review due words</p>
											<p className="text-xs text-muted-foreground">
												Spaced repetition keeps recall strong.
											</p>
										</div>
									</div>
									<div className="flex items-center gap-3 rounded-2xl border border-dashed border-border/80 px-4 py-3">
										<Mic2 className="h-5 w-5 shrink-0 text-[var(--brand-accent)]" aria-hidden />
										<p className="text-sm text-muted-foreground">
											Listen, repeat, and check meaning — in one flow.
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Steps */}
			<section className="border-b border-border/40 bg-muted/25 py-12 sm:py-16 dark:bg-muted/10">
				<div className="container mx-auto max-w-6xl px-4 sm:px-6">
					<h2 className="text-center text-xl font-semibold tracking-tight sm:text-2xl">
						How it works
					</h2>
					<p className="mx-auto mt-2 max-w-lg text-center text-sm text-muted-foreground">
						Three simple loops — build, practice, measure.
					</p>
					<div className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
						<div className="flex flex-col items-center text-center">
							<div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand shadow-md">
								<BookMarked className="h-7 w-7 text-white" aria-hidden />
							</div>
							<h3 className="font-semibold">Build your library</h3>
							<p className="mt-2 text-sm text-muted-foreground text-balance">
								Create courses and lessons. Add words you actually need.
							</p>
						</div>
						<div className="flex flex-col items-center text-center">
							<div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-accent shadow-md">
								<Mic2 className="h-7 w-7 text-white" aria-hidden />
							</div>
							<h3 className="font-semibold">Practice with audio</h3>
							<p className="mt-2 text-sm text-muted-foreground text-balance">
								Flashcards plus sound — train listening and recall together.
							</p>
						</div>
						<div className="flex flex-col items-center text-center">
							<div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-success shadow-md">
								<BarChart3 className="h-7 w-7 text-white" aria-hidden />
							</div>
							<h3 className="font-semibold">See your progress</h3>
							<p className="mt-2 text-sm text-muted-foreground text-balance">
								Know what is new, in learning, or ready for review.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Bento features */}
			<section className="py-12 sm:py-16">
				<div className="container mx-auto max-w-6xl px-4 sm:px-6">
					<h2 className="text-center text-xl font-semibold tracking-tight sm:text-2xl">
						What you get
					</h2>
					<div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-2 lg:gap-5">
						<Card
							className="cursor-pointer border-border/70 transition-[box-shadow,transform] hover:shadow-lg lg:col-span-1"
							onClick={() => router.push("/learn")}
						>
							<CardHeader className="pb-2">
								<div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl gradient-brand shadow-sm">
									<BookOpen className="h-5 w-5 text-white" aria-hidden />
								</div>
								<CardTitle className="text-lg">Learn mode</CardTitle>
								<CardDescription className="text-base leading-relaxed">
									Flashcards, audio, and self-check — paced for short daily sessions.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card
							className="cursor-pointer border-border/70 transition-[box-shadow] hover:shadow-lg"
							onClick={() => router.push("/manage")}
						>
							<CardHeader className="pb-2">
								<div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl gradient-accent shadow-sm">
									<Settings className="h-5 w-5 text-white" aria-hidden />
								</div>
								<CardTitle className="text-lg">Course studio</CardTitle>
								<CardDescription className="text-base leading-relaxed">
									Edit courses, lessons, and vocabulary in one calm workspace.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="border-border/70 sm:col-span-2 lg:col-span-2">
							<CardHeader className="pb-2 sm:flex sm:flex-row sm:items-start sm:gap-6">
								<div className="mb-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gradient-warm shadow-sm sm:mb-0">
									<Sparkles className="h-5 w-5 text-white" aria-hidden />
								</div>
								<div>
									<CardTitle className="text-lg">Smart practice</CardTitle>
									<CardDescription className="mt-1 text-base leading-relaxed">
										Progress stats and due words help you spend time where it counts —
										not on busywork.
									</CardDescription>
								</div>
							</CardHeader>
						</Card>
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="pb-16 pt-4 sm:pb-20">
				<div className="container mx-auto max-w-6xl px-4 sm:px-6">
					<div className="rounded-3xl border border-border/60 bg-card/90 px-6 py-10 text-center shadow-lg sm:px-12">
						<h2 className="text-xl font-semibold sm:text-2xl">Ready for your next session?</h2>
						<p className="mx-auto mt-2 max-w-md text-muted-foreground">
							Open Learn and pick up where you left off — two minutes is enough.
						</p>
						<Button
							size="lg"
							onClick={() => router.push("/learn")}
							className="mt-6 rounded-xl gradient-brand px-8 text-white shadow-lg shadow-primary/20"
						>
							Go to Learn
							<ArrowRight className="h-4 w-4" aria-hidden />
						</Button>
					</div>
				</div>
			</section>
		</main>
	);
}
