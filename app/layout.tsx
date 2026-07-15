import AppNav from '@/components/common/app-nav/app-nav';
import { BottomTabBar } from '@/components/common/app-nav/bottom-tab-bar';
import { ServiceWorkerRegistration } from '@/components/common/pwa/service-worker-registration';
import { Toaster } from '@/components/ui/sonner';
import type { Metadata, Viewport } from 'next';
import { Baloo_2, Geist_Mono, Nunito } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import './globals.css';
import { Providers } from './Providers';

const fontDisplay = Baloo_2({
    variable: '--font-display',
    subsets: ['latin'],
    weight: ['500', '600', '700', '800'],
});

const fontSans = Nunito({
    variable: '--font-sans-custom',
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
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
    themeColor: '#7c3aed',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang='en' suppressHydrationWarning>
            <body
                className={`${fontDisplay.variable} ${fontSans.variable} ${geistMono.variable} mesh-page-bg min-h-dvh`}
            >
                <NuqsAdapter>
                    <Providers>
                        <AppNav />
                        {children}
                        <BottomTabBar />
                        <Toaster />
                        <ServiceWorkerRegistration />
                    </Providers>
                </NuqsAdapter>
            </body>
        </html>
    );
}
