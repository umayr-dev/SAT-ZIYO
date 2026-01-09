import Header from "@/src/components/sections/Header";
import Footer from "@/src/components/sections/Footer";
import { ScoreCalculatorClient } from "@/src/components/calculator/ScoreCalculatorClient";

/**
 * Score Calculator Page - Server Component Wrapper
 *
 * Performance Benefits:
 * - Server-rendered layout (Header, Footer)
 * - SEO-friendly
 * - Fast FCP (First Contentful Paint)
 * - Calculation logic on server (no client JS bundle)
 * - Minimal hydration cost (only form interactions)
 */
export default function ScoreCalculatorPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <ScoreCalculatorClient />
      <Footer />
    </main>
  );
}
