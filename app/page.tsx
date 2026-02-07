import Header from "@/src/components/sections/Header";
import Hero from "@/src/components/sections/Hero";
import Statistics from "@/src/components/sections/Statistics";
import Features from "@/src/components/sections/Features";
import HowItWorks from "@/src/components/sections/HowItWorks";
import Testimonials from "@/src/components/sections/Testimonials";
import Pricing from "@/src/components/sections/Pricing";
import CTA from "@/src/components/sections/CTA";
import Footer from "@/src/components/sections/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Statistics />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
