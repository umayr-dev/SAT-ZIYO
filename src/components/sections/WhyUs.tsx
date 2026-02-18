"use client";

import { useEffect, useState } from "react";
import { Award, Target, Zap, Users } from "lucide-react";

const ITEMS = [
  {
    icon: Award,
    title: "Proven results",
    description: "Students improve their scores with full-length mocks and real exam format.",
  },
  {
    icon: Target,
    title: "Clear goals",
    description: "Scaled scores (400–1600), section breakdowns, and progress tracking.",
  },
  {
    icon: Zap,
    title: "Instant feedback",
    description: "See your score and percentile right after submission. No waiting.",
  },
  {
    icon: Users,
    title: "Practice anytime",
    description: "Web & mobile-friendly. 8 free mocks to start—no card required.",
  },
];

export default function WhyUs() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById("why-us");
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="why-us" className="py-20 sm:py-28 bg-white border-t border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`max-w-2xl mx-auto text-center mb-16 transition-all duration-600 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            About us
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Discover what sets us apart—our key strengths that drive your success.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={`rounded-2xl border border-slate-200 bg-slate-50/50 p-6 transition-all duration-600 hover:border-brand-blue-light hover:shadow-md ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${100 + i * 80}ms` }}
              >
                <div className="w-10 h-10 rounded-xl bg-brand-blue text-white flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
