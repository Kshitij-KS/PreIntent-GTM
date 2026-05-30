import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: {
    default: "Undertow | Convergent GTM Intelligence",
    template: "%s | Undertow",
  },
  description:
    "Three invisible forces. One unfair pipeline advantage. Undertow triangulates competitor retreats (Void Scanner), regulatory shockwaves (Compliance Radar), and community pain signals (Pain Listener) into high-confidence buying events with AI-generated Intel Briefs — before any intent vendor knows.",
  keywords: [
    "GTM intelligence",
    "competitor monitoring",
    "sales intelligence",
    "buyer intent",
    "B2B sales",
    "convergent signals",
  ],
  openGraph: {
    title: "Undertow | Convergent GTM Intelligence",
    description: "Three invisible forces. One unfair pipeline advantage.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
