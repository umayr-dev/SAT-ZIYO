import type { Metadata, Viewport } from "next";
import "./globals.css";
import { QueryProvider } from "@/src/lib/providers/query-provider";

export const metadata: Metadata = {
  title: "SAT Ziyo - Comprehensive SAT Practice Platform",
  description:
    "Comprehensive SAT English & Math practice platform. Boost your SAT prep with daily targeted questions, track progress, and get instant feedback.",
  robots: "index, follow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Baskervville:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-white">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
