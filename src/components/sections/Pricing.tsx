"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Start with full-length mocks—no card required.",
    features: [
      "8 full-length mock tests",
      "Real Digital SAT format",
      "Score & section breakdown",
      "Question-by-question review",
      "Progress tracking",
    ],
    cta: "Get Started Free",
    href: "/auth/register",
    popular: false,
    accent: false,
  },
  {
    name: "Premium",
    price: "$15",
    period: "per month",
    description: "Unlimited mocks and full access.",
    features: [
      "Unlimited full-length mocks",
      "All Free features",
      "Advanced analytics",
      "Detailed explanations",
      "Priority support",
    ],
    cta: "Start Premium",
    href: "/auth/register?plan=premium",
    popular: true,
    accent: true,
  },
];

export default function Pricing() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById("pricing");
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`max-w-2xl mx-auto text-center mb-16 transition-all duration-600 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Simple pricing
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Two plans: start free with 8 mocks, or go Premium for unlimited access from $15.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {PLANS.map((plan, i) => (
            <div
              key={plan.name}
              className={`relative transition-all duration-600 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: `${80 + i * 120}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold text-white bg-slate-900 rounded-full">
                  Most popular
                </div>
              )}
              <div
                className={`h-full rounded-2xl border-2 p-8 flex flex-col ${
                  plan.accent
                    ? "border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-900/10"
                    : "border-slate-200 bg-slate-50/50"
                }`}
              >
                <h3 className={`text-xl font-bold ${plan.accent ? "text-white" : "text-slate-900"}`}>{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className={`text-4xl font-bold ${plan.accent ? "text-white" : "text-slate-900"}`}>
                    {plan.price}
                  </span>
                  <span className={plan.accent ? "text-slate-400" : "text-slate-500"}>
                    /{plan.period}
                  </span>
                </div>
                <p className={`mt-2 text-sm ${plan.accent ? "text-slate-400" : "text-slate-600"}`}>
                  {plan.description}
                </p>
                <ul className="mt-6 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Check
                        className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                          plan.accent ? "text-emerald-400" : "text-slate-600"
                        }`}
                      />
                      <span className={plan.accent ? "text-slate-200" : "text-slate-700"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`mt-8 inline-flex items-center justify-center w-full py-3.5 px-6 rounded-xl text-base font-semibold transition-colors ${
                    plan.accent
                      ? "bg-white text-slate-900 hover:bg-slate-100"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
