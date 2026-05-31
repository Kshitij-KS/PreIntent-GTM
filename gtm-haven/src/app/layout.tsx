import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Preintent | Convergent GTM Intelligence",
    template: "%s | Preintent",
  },
  description:
    "Three invisible forces. One unfair pipeline advantage. Preintent triangulates competitor retreats (Void Atlas), regulatory shockwaves (Compliance Radar), and community pain signals (Pain Listener) into high-confidence buying events with AI-generated Intel Briefs — before any intent vendor knows.",
  keywords: [
    "GTM intelligence",
    "competitor monitoring",
    "sales intelligence",
    "buyer intent",
    "B2B sales",
    "convergent signals",
  ],
  openGraph: {
    title: "Preintent | Convergent GTM Intelligence",
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
      className={`${ibmPlexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
