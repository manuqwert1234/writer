import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ClientOnly } from "@/components/ClientOnly";
import { OptimizedAuthProvider } from "@/components/OptimizedAuthProvider";
import { Navbar } from "@/components/Navbar";
import { LazyPlayer } from "@/components/LazyPlayer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Writer",
  description: "A minimal writing space",
  manifest: "/manifest.webmanifest",
};

export const viewport = {
  themeColor: "#000000",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased page-fade`}
      >
        <ErrorBoundary>
          <ClientOnly>
          <OptimizedAuthProvider>
            <ThemeProvider>
              {/* Lazy Player is outside the content wrapper so it can be fixed background */}
              <LazyPlayer />

              {/* Content wrapper - TRANSPARENT to show gradient */}
              <div className="relative z-10 w-full min-h-screen" style={{ background: 'transparent' }}>
                <Navbar />
                {children}
              </div>
            </ThemeProvider>
          </OptimizedAuthProvider>
        </ClientOnly>
        </ErrorBoundary>
      </body>
    </html>
  );
}
