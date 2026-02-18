"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Monitor, FileQuestion, BarChart2, Clock } from "lucide-react";

export default function PlatformSection() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById("platform");
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="platform" className="py-20 sm:py-28 bg-slate-50 border-t border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`max-w-2xl mx-auto text-center mb-12 transition-all duration-600 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Score calculator
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Calculate your scaled SAT score (400–1600) from your practice tests, with section breakdown and detailed review.
          </p>
        </div>
        <div
          className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-600 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "100ms" }}
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col items-center text-center">
            <Monitor className="h-10 w-10 text-brand-blue mb-3" />
            <h3 className="font-semibold text-slate-900">Real exam format</h3>
            <p className="mt-1 text-sm text-slate-600">Reading & Writing + Math, timed sections</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col items-center text-center">
            <FileQuestion className="h-10 w-10 text-brand-blue mb-3" />
            <h3 className="font-semibold text-slate-900">98 questions per test</h3>
            <p className="mt-1 text-sm text-slate-600">Full-length Digital SAT structure</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col items-center text-center">
            <BarChart2 className="h-10 w-10 text-brand-blue mb-3" />
            <h3 className="font-semibold text-slate-900">Scaled scores 400–1600</h3>
            <p className="mt-1 text-sm text-slate-600">Section breakdown & analytics</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col items-center text-center">
            <Clock className="h-10 w-10 text-brand-blue mb-3" />
            <h3 className="font-semibold text-slate-900">Practice anytime</h3>
            <p className="mt-1 text-sm text-slate-600">Web & mobile-friendly</p>
          </div>
        </div>
        <div className={`mt-10 text-center transition-all duration-600 ${visible ? "opacity-100" : "opacity-0"}`}>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-brand-orange hover:bg-brand-orange/90 rounded-xl transition-colors"
          >
            Start practicing
          </Link>
        </div>
      </div>
    </section>
  );
}
