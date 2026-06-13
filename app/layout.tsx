import AppNav from '@/components/common/app-nav/app-nav';
import { Toaster } from '@/components/ui/sonner';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import './globals.css';
import { Providers } from './Providers';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Wordsly - English Learning App',
    description: 'Learn English vocabulary effectively with Wordsly',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang='en' suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} mesh-page-bg min-h-dvh`}
            >
                <NuqsAdapter>
                    <Providers>
                        <AppNav />
                        {children}
                        <Toaster />
                    </Providers>
                </NuqsAdapter>
            </body>
        </html>
    );
}
