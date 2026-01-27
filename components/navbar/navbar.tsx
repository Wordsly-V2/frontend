
import Link from "next/link";
import { Suspense } from "react";
import dynamic from "next/dynamic";
const UserMenu = dynamic(() => import('./user-menu').then(mod => mod.UserMenu));
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo - Góc trái */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
            Wordsly
          </span>
        </Link>

        {/* Menu - Giữa */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Trang chủ
          </Link>
          <Link
            href="/learn"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Học từ vựng
          </Link>
          <Link
            href="/vocabulary"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Từ điển của tôi
          </Link>
          <Link
            href="/stats"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Thống kê
          </Link>
        </div>

        {/* User Menu - Góc phải */}
        <Suspense fallback={<LoadingSpinner />}>
          <UserMenu />
        </Suspense>
      </div>

      {/* Mobile Menu - Optional */}
      <div className="md:hidden border-t border-border px-4 py-2 flex gap-4 overflow-x-auto">
        <Link
          href="/"
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
        >
          Trang chủ
        </Link>
        <Link
          href="/learn"
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
        >
          Học từ vựng
        </Link>
        <Link
          href="/vocabulary"
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
        >
          Từ điển
        </Link>
        <Link
          href="/stats"
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
        >
          Thống kê
        </Link>
      </div>
    </nav>
  );
}
