"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <span className="text-xl font-bold text-white">SAT Ziyo</span>
            <p className="mt-3 text-sm text-slate-400 max-w-sm leading-relaxed">
              Digital SAT preparation with full-length mocks, real exam format, and analytics. Unlock your dream score.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/dashboard/practice" className="text-sm hover:text-white transition-colors">
                  Practice Tests
                </Link>
              </li>
              <li>
                <Link href="/score-calculator" className="text-sm hover:text-white transition-colors">
                  Score Calculator
                </Link>
              </li>
              <li>
                <a href="/#pricing" className="text-sm hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/support" className="text-sm hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <a href="/#testimonials" className="text-sm hover:text-white transition-colors">
                  Testimonials
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/oferta" className="text-sm hover:text-white transition-colors">
                  Public offer (Oferta)
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} SAT Ziyo. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
