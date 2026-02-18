"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-[75vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-white to-brand-blue-50/80 py-20"
    >
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-sm font-medium tracking-widest text-gray-500 uppercase mb-6">
          Digital SAT Prep Platform
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-brand-blue leading-[1.1]">
          Unlock your dream{" "}
          <span className="text-brand-orange">SAT score.</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 leading-relaxed">
          Full-length mock tests, real exam format, and detailed analytics. Start with 8 free mocks—no card required.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#courses"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("courses")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-brand-orange hover:bg-brand-orange-light rounded-xl transition-colors"
          >
            View Programs
            <ArrowRight className="h-4 w-4" />
          </a>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors"
          >
            Get Started Free
          </Link>
        </div>
        <p className="mt-6 text-sm text-gray-400">
          8 free full-length mock tests. No credit card required
        </p>
      </div>
    </section>
  );
}
