"use client";

import { useEffect, useState } from "react";

const STATS = [
  { value: "8", label: "Free full-length mocks", sub: "No card required" },
  { value: "98", label: "Questions per test", sub: "Real Digital SAT format" },
  { value: "Unlimited", label: "With Premium", sub: "From $15" },
  { value: "24/7", label: "Practice anytime", sub: "Web & mobile-friendly" },
];

export default function Statistics() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById("statistics");
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="statistics" className="py-16 sm:py-20 bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={`text-center transition-all duration-600 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="text-3xl sm:text-4xl font-bold text-white">
                {stat.value}
              </div>
              <div className="mt-1 text-sm font-medium text-slate-300">
                {stat.label}
              </div>
              <div className="mt-0.5 text-xs text-slate-500">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
