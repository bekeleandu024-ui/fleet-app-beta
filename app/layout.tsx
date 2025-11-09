// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./styles/print.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FleetOps Enterprise - Dashboard",
  description: "Enterprise fleet management and operations platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen
                    bg-background text-foreground`}
      >
        {/* optional: subtle depth layer */}
        <div className="pointer-events-none fixed inset-0 -z-10
                        bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(16,185,129,.06),transparent)]" />
        {children}
      </body>
    </html>
  );
}
