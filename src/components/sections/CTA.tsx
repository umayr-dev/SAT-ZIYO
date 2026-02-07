"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section id="cta" className="py-20 sm:py-28 bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Ready to unlock your SAT score?
        </h2>
        <p className="mt-4 text-lg text-slate-400">
          Start with 8 free full-length mocks. No credit card required.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-colors"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white border border-slate-600 hover:bg-slate-800 rounded-xl transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </section>
  );
}
