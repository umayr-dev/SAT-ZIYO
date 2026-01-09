import type { Metadata, Viewport } from "next";
import "./globals.css";
import { QueryProvider } from "@/src/lib/providers/query-provider";

// Font loading - using system fonts for better performance
// If you need Google Fonts, uncomment below and ensure internet during build
// import { Baskervville } from "next/font/google";
// const baskervville = Baskervville({
//   weight: ["400"],
//   style: ["normal", "italic"],
//   subsets: ["latin"],
//   display: "swap",
//   preload: true,
//   variable: "--font-baskervville",
//   fallback: ["Baskerville", "Goudy Old Style", "Palatino", "serif"],
// });

export const metadata: Metadata = {
  title: "SAT Ziyo - Comprehensive SAT Practice Platform",
  description:
    "Comprehensive SAT English & Math practice platform. Boost your SAT prep with daily targeted questions, track progress, and get instant feedback.",
  robots: "index, follow",
  openGraph: {
    title: "SAT Ziyo - Comprehensive SAT Practice Platform",
    description: "Master SAT English & Math with comprehensive practice tests",
    type: "website",
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
    <html lang="en">
      <body className="antialiased bg-white font-sans">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
