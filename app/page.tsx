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
		<main className="min-h-screen bg-background">
			{/* Hero */}
			<section className="relative overflow-hidden border-b border-border">
				<div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
				<div className="absolute top-20 left-1/4 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
				<div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
				<div className="container relative mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-16 sm:pb-24 max-w-5xl">
					<div className="text-center max-w-3xl mx-auto">
						<div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl gradient-brand mb-6 shadow-lg shadow-primary/25">
							<GraduationCap className="h-7 w-7 sm:h-8 sm:w-8 text-white" aria-hidden />
						</div>
						<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance mb-4">
							<span className="bg-gradient-to-r from-primary to-[var(--brand-accent)] bg-clip-text text-transparent">
								Learn English Words
							</span>
						</h1>
						<p className="text-lg sm:text-xl text-muted-foreground mb-8 sm:mb-10 text-balance">
							Build vocabulary with flashcards, track your progress, and practice at your own pace.
						</p>
						<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
							<Button
								size="lg"
								onClick={() => router.push("/learn")}
								className="text-base h-11 sm:h-12 px-6 sm:px-8 w-full sm:w-auto gradient-brand text-white border-0 hover:opacity-90 shadow-lg shadow-primary/25 transition-opacity"
							>
								<BookOpen className="h-4 w-4 sm:h-5 sm:w-5 mr-2" aria-hidden />
								Start Learning
							</Button>
							<Button
								size="lg"
								variant="outline"
								onClick={() => router.push("/manage")}
								className="text-base h-11 sm:h-12 px-6 sm:px-8 w-full sm:w-auto cursor-pointer"
							>
								<Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-2" aria-hidden />
								Manage Courses
							</Button>
						</div>

						{!profile && (
							<p className="mt-6 text-sm text-muted-foreground">
								New here?{" "}
								<Link
									href="/auth/login"
									className="text-primary font-medium hover:underline underline-offset-4 cursor-pointer"
								>
									Sign in
								</Link>{" "}
								to sync your progress.
							</p>
						)}
					</div>
				</div>
			</section>

			{/* How it works */}
			<section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 max-w-5xl">
				<h2 className="text-xl sm:text-2xl font-semibold text-center mb-8 sm:mb-12">
					How it works
				</h2>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
					<div className="flex flex-col items-center text-center">
						<div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center mb-4">
							<BookMarked className="h-6 w-6 text-white" aria-hidden />
						</div>
						<h3 className="font-semibold mb-2">Create your own courses</h3>
						<p className="text-sm text-muted-foreground text-balance">
							Create your own courses and lessons. Add your own words and lessons. Organize everything in one place.
						</p>
					</div>

					<div className="flex flex-col items-center text-center">
						<div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center mb-4">
							<Mic2 className="h-6 w-6 text-white" aria-hidden />
						</div>
						<h3 className="font-semibold mb-2">Practice with flashcards and audio</h3>
						<p className="text-sm text-muted-foreground text-balance">
							Practice with flashcards, audio, and self-assessment. Master new words step by step.
						</p>
					</div>
					<div className="flex flex-col items-center text-center">
						<div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center mb-4">
							<BarChart3 className="h-6 w-6 text-white" aria-hidden />
						</div>
						<h3 className="font-semibold mb-2">Track your progress</h3>
						<p className="text-sm text-muted-foreground text-balance">
							See how many words you know and where to focus next.
						</p>
					</div>
				</div>
			</section>

			{/* Features grid */}
			<section className="border-t border-border bg-muted/30">
				<div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 max-w-5xl">
					<h2 className="text-xl sm:text-2xl font-semibold text-center mb-8 sm:mb-12">
						What you get
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
						<Card
							className="border-border bg-card cursor-pointer card-hover transition-all duration-300"
							onClick={() => router.push("/learn")}
						>
							<CardHeader className="pb-2">
								<div className="w-10 h-10 rounded-lg gradient-brand flex items-center justify-center mb-2">
									<BookOpen className="h-5 w-5 text-white" aria-hidden />
								</div>
								<CardTitle className="text-lg">Learn mode</CardTitle>
								<CardDescription>
									Practice with interactive flashcards, audio, and self-assessment. Master new words step by step.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card
							className="border-border bg-card cursor-pointer card-hover transition-all duration-300"
							onClick={() => router.push("/manage")}
						>
							<CardHeader className="pb-2">
								<div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center mb-2">
									<Settings className="h-5 w-5 text-white" aria-hidden />
								</div>
								<CardTitle className="text-lg">Manage courses</CardTitle>
								<CardDescription>
									Create and edit courses, lessons, and vocabulary. Organize everything in one place.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="border-border bg-card">
							<CardHeader className="pb-2">
								<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--brand-success)] to-[var(--brand-secondary)] flex items-center justify-center mb-2">
									<Sparkles className="h-5 w-5 text-white" aria-hidden />
								</div>
								<CardTitle className="text-lg">Smart practice</CardTitle>
								<CardDescription>
									Flashcard-based learning with audio support and progress tracking built in.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card className="border-border bg-card">
							<CardHeader className="pb-2">
								<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--brand-warning)] to-[var(--brand-orange)] flex items-center justify-center mb-2">
									<GraduationCap className="h-5 w-5 text-white" aria-hidden />
								</div>
								<CardTitle className="text-lg">Track your progress</CardTitle>
								<CardDescription>
									See how many words you know and where to focus next.
								</CardDescription>
							</CardHeader>
						</Card>
					</div>
				</div>
			</section>

			{/* Final CTA */}
			<section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 max-w-5xl">
				<div className="rounded-2xl border border-border bg-card p-8 sm:p-10 text-center shadow-sm">
					<h2 className="text-xl sm:text-2xl font-semibold mb-2">
						Ready to start?
					</h2>
					<p className="text-muted-foreground mb-6 max-w-md mx-auto">
						Choose your mode above and begin your English learning journey today.
					</p>
					<Button
						size="lg"
						onClick={() => router.push("/learn")}
						className="gradient-brand text-white border-0 hover:opacity-90 shadow-lg shadow-primary/25 transition-opacity cursor-pointer"
					>
						Start Learning
						<ArrowRight className="h-4 w-4 ml-2" aria-hidden />
					</Button>
				</div>
			</section>
		</main>
	);
}
