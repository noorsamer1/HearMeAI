import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HearME AI - Communication Assistant",
  description:
    "Real-time AI-powered communication assistant for deaf and mute individuals.",
  keywords: ["deaf", "mute", "accessibility", "speech to text", "text to speech", "AI", "HearME"],
  authors: [{ name: "HearME AI" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0f1117",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-slate-950 font-sans text-slate-50 antialiased selection:bg-indigo-500/30">
        {children}
      </body>
    </html>
  );
}
