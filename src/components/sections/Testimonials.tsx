"use client";

import { useEffect, useState } from "react";

const QUOTES = [
  {
    text: "The mock tests felt exactly like the real exam. I improved my score by 120 points in two months.",
    name: "Student",
    role: "Digital SAT test-taker",
  },
  {
    text: "Clear analytics helped me see exactly where to focus. The 8 free mocks were enough to get started.",
    name: "Student",
    role: "Prep in Uzbekistan",
  },
  {
    text: "Full-length mocks with real timing made a huge difference. Highly recommend for anyone serious about the SAT.",
    name: "Student",
    role: "International applicant",
  },
];

export default function Testimonials() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById("testimonials");
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="testimonials" className="py-20 sm:py-28 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`max-w-2xl mx-auto text-center mb-16 transition-all duration-600 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Hear from Our Students
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Join students who improved their scores with full-length mocks and clear feedback.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {QUOTES.map((q, i) => (
            <div
              key={i}
              className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-600 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: `${100 + i * 100}ms` }}
            >
              <p className="text-slate-700 leading-relaxed">&ldquo;{q.text}&rdquo;</p>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="font-semibold text-slate-900">{q.name}</div>
                <div className="text-sm text-slate-500">{q.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
