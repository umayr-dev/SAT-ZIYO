"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

const ITEMS = [
  {
    q: "How many free tests do I get?",
    a: "You get 8 full-length Digital SAT mock tests for free. No credit card required. Upgrade to Premium for unlimited mocks from $15/month.",
  },
  {
    q: "Is the format the same as the real SAT?",
    a: "Yes. Our tests follow the official Digital SAT structure: Reading & Writing and Math sections, 98 questions total, with real timing and breaks.",
  },
  {
    q: "When do I see my score?",
    a: "Right after you submit. You get a scaled score (400–1600), section breakdown, and question-by-question review with explanations.",
  },
  {
    q: "Can I practice on my phone?",
    a: "Yes. The platform is web-based and works on desktop, tablet, and mobile so you can practice anytime.",
  },
];

export default function FAQ() {
  const [visible, setVisible] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    const el = document.getElementById("faq");
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="faq" className="py-20 sm:py-28 bg-slate-50 border-t border-slate-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`text-center mb-12 transition-all duration-600 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            FAQ
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Common questions about SAT Ziyo and our platform.
          </p>
        </div>
        <div className={`space-y-2 transition-all duration-600 ${visible ? "opacity-100" : "opacity-0"}`}>
          {ITEMS.map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors"
              >
                {item.q}
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === i && (
                <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-2">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
        <p className={`mt-6 text-center text-sm text-slate-600 transition-all duration-600 ${visible ? "opacity-100" : "opacity-0"}`}>
          More questions? <Link href="/support" className="text-brand-orange hover:underline font-medium">Contact support</Link>.
        </p>
      </div>
    </section>
  );
}
