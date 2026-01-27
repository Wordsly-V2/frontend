import Link from "next/link";
import { Suspense } from "react";
import dynamic from "next/dynamic";
const UserMenu = dynamic(() => import('./user-menu').then(mod => mod.UserMenu));
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function Navbar() {
  const menuItems = [
    { label: "Trang chủ", href: "/" },
    { label: "Khóa học của tôi", href: "/courses" },
    { label: "Học từ vựng", href: "/learn" },
    { label: "Từ điển của tôi", href: "/vocabulary" },
    { label: "Thống kê", href: "/stats" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <input
        id="mobile-menu-toggle"
        type="checkbox"
        className="peer sr-only"
      />
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
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* User Menu - Góc phải */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="mobile-menu-toggle"
            className="md:hidden inline-flex items-center justify-center rounded-md border border-border p-2 text-muted-foreground hover:text-primary hover:border-primary transition-colors cursor-pointer"
            aria-label="Mở menu"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </label>

          <Suspense fallback={<LoadingSpinner />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>

      {/* Mobile Menu - Optional */}
      <div
        className="md:hidden overflow-hidden transition-[max-height,opacity] duration-500 ease-out max-h-0 opacity-0 pointer-events-none peer-checked:max-h-60 peer-checked:opacity-100 peer-checked:pointer-events-auto"
      >
        <div className="border-t border-border px-4 py-3 flex flex-col gap-2">
          {
            menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))
          }
        </div>
      </div>
    </nav>
  );
}
