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
    <main className="min-h-screen">
      <Header />
      <section id="home">
        <Hero />
      </section>
      <section id="statistics">
        <Statistics />
      </section>
      <section id="features">
        <Features />
      </section>
      <section id="how-it-works">
        <HowItWorks />
      </section>
      <section id="testimonials">
        <Testimonials />
      </section>
      <section id="pricing">
        <Pricing />
      </section>
      <section id="cta">
        <CTA />
      </section>
      <Footer />
    </main>
  );
}
