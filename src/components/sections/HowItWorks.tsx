"use client";

import { useEffect, useState } from "react";
import { UserPlus, Play, BarChart2, Award } from "lucide-react";

const STEPS = [
  {
    step: "1",
    icon: UserPlus,
    title: "Sign up free",
    text: "Create an account in seconds. No credit card. Get access to 8 full-length mocks right away.",
  },
  {
    step: "2",
    icon: Play,
    title: "Take mocks",
    text: "Practice with timed, full-length Digital SAT tests. Same structure and timing as the real exam.",
  },
  {
    step: "3",
    icon: BarChart2,
    title: "Review results",
    text: "See your scaled score, section breakdown, and question-by-question review with explanations.",
  },
  {
    step: "4",
    icon: Award,
    title: "Improve & repeat",
    text: "Track progress over time. Upgrade to Premium for unlimited mocks and deeper analytics.",
  },
];

export default function HowItWorks() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById("how-it-works");
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`max-w-2xl mx-auto text-center mb-16 transition-all duration-600 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            How it works
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Four simple steps from sign-up to a higher score.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className={`relative transition-all duration-600 ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${100 + i * 100}ms` }}
              >
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 h-full shadow-sm hover:border-brand-blue-light hover:shadow-md transition-all">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-blue text-white text-sm font-bold">
                    {s.step}
                  </span>
                  <div className="mt-4 w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
