"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileQuestion, BarChart3, BookOpen, Zap, ArrowRight } from "lucide-react";

// Freshman-style: program cards with title, description, "Learn more"
const ITEMS = [
  {
    icon: FileQuestion,
    title: "Full-length mock tests",
    description: "Real Digital SAT format: Reading & Writing + Math, timed sections and breaks.",
    href: "/auth/register",
  },
  {
    icon: BarChart3,
    title: "Score & analytics",
    description: "Scaled scores (400–1600), section breakdowns, and progress over time.",
    href: "/auth/register",
  },
  {
    icon: BookOpen,
    title: "Review & explanations",
    description: "Review every question after the test with clear explanations and strategies.",
    href: "/auth/register",
  },
  {
    icon: Zap,
    title: "Instant feedback",
    description: "See your score and percentile right after submission. No waiting.",
    href: "/auth/register",
  },
];

export default function Features() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById("courses");
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="courses" className="py-20 sm:py-28 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`max-w-2xl mx-auto text-center mb-16 transition-all duration-600 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Discover the programs designed to help you succeed
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Full-length mocks, real format, and clear analytics—so you can focus on improving.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={`rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-600 hover:border-slate-300 hover:shadow-md flex flex-col ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${120 + i * 80}ms` }}
              >
                <div className="w-10 h-10 rounded-xl bg-brand-blue text-white flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed flex-1">{item.description}</p>
                <Link
                  href={item.href}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-orange hover:text-brand-orange/80 transition-colors"
                >
                  Learn more
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
