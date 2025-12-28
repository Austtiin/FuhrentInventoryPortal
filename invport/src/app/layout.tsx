import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClientProviders } from "@/components/providers/ClientProviders";
import DevAuthGuard from "@/components/providers/DevAuthGuard";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  
});

export const metadata: Metadata = {
  title: "Fuhr Enterprise Dealer Inventory - Admin Dashboard",
  description: "Professional inventory management system for Fuhr Enterprise automotive dealers",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    nocache: true,
  },
  other: {
    'robots': 'noindex, nofollow, noarchive, nosnippet, noimageindex, nocache',
    'googlebot': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
    'bingbot': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
  },
  icons: {
    icon: '/logo/FELogo.png',
    apple: '/logo/FELogo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Register service worker and refresh blob image cache on page load */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then(() => navigator.serviceWorker.ready)
                  .then((reg) => {
                    // On full page load, request SW to clear image cache
                    // so subsequent image requests fetch fresh copies.
                    if (reg && reg.active) {
                      reg.active.postMessage({ type: 'refresh-images' });
                    }
                  })
                  .catch(() => {});
              });
            }
          `,
        }}
      />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground font-sans`}
      >
        <ClientProviders>
          <DevAuthGuard>
            {children}
          </DevAuthGuard>
        </ClientProviders>
      </body>
    </html>
  );
}

