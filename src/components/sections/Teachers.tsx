"use client";

import { useEffect, useState } from "react";
import { GraduationCap, BookOpen, Award } from "lucide-react";

const POINTS = [
  "Experienced instructors and clear methodology",
  "Real Digital SAT format and question types",
  "Focus on strategy and time management",
];

export default function Teachers() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById("teachers");
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="teachers" className="py-20 sm:py-28 bg-white border-t border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`max-w-2xl mx-auto text-center mb-12 transition-all duration-600 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Teachers & methodology
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Our platform is built with best practices from SAT experts. Clear explanations and strategies for every question.
          </p>
        </div>
        <div
          className={`grid sm:grid-cols-3 gap-6 transition-all duration-600 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "100ms" }}
        >
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 flex flex-col items-center text-center">
            <GraduationCap className="h-10 w-10 text-brand-blue mb-3" />
            <h3 className="font-semibold text-slate-900">Expert content</h3>
            <p className="mt-2 text-sm text-slate-600">Questions and explanations aligned with the real Digital SAT.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 flex flex-col items-center text-center">
            <BookOpen className="h-10 w-10 text-brand-blue mb-3" />
            <h3 className="font-semibold text-slate-900">Learn by doing</h3>
            <p className="mt-2 text-sm text-slate-600">Full-length mocks and question-by-question review.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 flex flex-col items-center text-center">
            <Award className="h-10 w-10 text-brand-blue mb-3" />
            <h3 className="font-semibold text-slate-900">Track progress</h3>
            <p className="mt-2 text-sm text-slate-600">Scaled scores, section breakdown, and accuracy over time.</p>
          </div>
        </div>
        <ul className={`mt-8 max-w-xl mx-auto space-y-2 text-slate-600 text-sm transition-all duration-600 ${visible ? "opacity-100" : "opacity-0"}`}>
          {POINTS.map((p, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-orange shrink-0" />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
