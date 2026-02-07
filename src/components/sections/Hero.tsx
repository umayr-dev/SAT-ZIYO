"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-slate-50"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.12),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_80%_50%,rgba(148,163,184,0.08),transparent)]" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <p className="text-sm font-medium tracking-wide text-slate-500 uppercase mb-6">
          Digital SAT Prep Platform
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
          Unlock your dream
          <br />
          <span className="text-slate-600">SAT score.</span>
        </h1>
        <p className="mt-8 max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 leading-relaxed">
          Full-length mock tests, real exam format, and detailed analytics. Start with 8 free mocks—no card required.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-lg shadow-slate-900/20"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
          >
            Sign In
          </Link>
        </div>

        <p className="mt-6 text-sm text-slate-500">
          8 free full-length mock tests · No credit card required
        </p>
      </div>
    </section>
  );
}
