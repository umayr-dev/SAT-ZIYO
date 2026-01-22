import type { Metadata, Viewport } from "next";
// CSS import - must be at the top to prevent CSS loss
import "./globals.css";
import { QueryProvider } from "@/src/lib/providers/query-provider";
import dynamic from "next/dynamic";

// Dynamic import for Client Components to prevent server/client boundary issues
const FloatingButtons = dynamic(
  () =>
    import("@/src/components/common/FloatingButtons").then(
      (mod) => mod.FloatingButtons
    ),
  { ssr: false } // Disable SSR for floating buttons
);

// Font loading - Inter for modern, clean dashboard UI
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://sat-ziyo.com"
  ),
  title: {
    default: "SAT Ziyo - Digital SAT Prep Platform",
    template: "%s | SAT Ziyo",
  },
  description:
    "Comprehensive Digital SAT English & Math practice platform. Boost your SAT prep with daily targeted questions, track progress, get instant feedback, and calculate your SAT score with our advanced calculator.",
  keywords: [
    "SAT prep",
    "Digital SAT",
    "SAT practice",
    "SAT English",
    "SAT Math",
    "SAT calculator",
    "SAT score",
    "SAT Ziyo",
    "SAT Uzbekistan",
  ],
  authors: [{ name: "SAT Ziyo Team" }],
  creator: "SAT Ziyo",
  publisher: "SAT Ziyo",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/logo.png", sizes: "any" },
      { url: "/logo.png", type: "image/png" },
    ],
    apple: [{ url: "/logo.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/logo.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://satziyo.uz",
    siteName: "SAT Ziyo",
    title: "SAT Ziyo - Digital SAT Prep Platform",
    description:
      "Comprehensive Digital SAT English & Math practice platform. Boost your SAT prep with daily targeted questions, track progress, and get instant feedback.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "SAT Ziyo - Digital SAT Prep Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SAT Ziyo - Digital SAT Prep Platform",
    description:
      "Comprehensive Digital SAT English & Math practice platform. Boost your SAT prep with daily targeted questions.",
    images: ["/logo.png"],
    creator: "@satziyo",
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || "https://sat-ziyo.com",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f97316", // orange-500
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-white font-sans">
        <QueryProvider>
          {children}
          {/* Floating Action Buttons - Client Component with dynamic import */}
          <FloatingButtons />
        </QueryProvider>
      </body>
    </html>
  );
}
