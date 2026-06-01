import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NetSpeed — Internet Speed Test",
  description:
    "Measure your internet connection speed in real-time. Test download, upload, ping, and jitter with accurate results.",
  keywords: ["speed test", "internet speed", "download speed", "upload speed", "ping test"],
};

export const viewport: Viewport = {
  colorScheme: "light dark",
};

// Injected before first paint to avoid flash-of-wrong-theme
const themeScript = `(function(){
  try {
    var t = localStorage.getItem('nst-theme');
    if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch(e) {}
})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
