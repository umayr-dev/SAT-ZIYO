import Header from "@/src/components/sections/Header";
import Hero from "@/src/components/sections/Hero";
import Statistics from "@/src/components/sections/Statistics";
import WhyUs from "@/src/components/sections/WhyUs";
import Features from "@/src/components/sections/Features";
import PlatformSection from "@/src/components/sections/PlatformSection";
import HowItWorks from "@/src/components/sections/HowItWorks";
import Teachers from "@/src/components/sections/Teachers";
import Testimonials from "@/src/components/sections/Testimonials";
import FAQ from "@/src/components/sections/FAQ";
import Vacancy from "@/src/components/sections/Vacancy";
import CTA from "@/src/components/sections/CTA";
import Footer from "@/src/components/sections/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Statistics />
      <WhyUs />
      <Features />
      <PlatformSection />
      <HowItWorks />
      <Teachers />
      <Testimonials />
      <FAQ />
      <Vacancy />
      <CTA />
      <Footer />
    </main>
  );
}
