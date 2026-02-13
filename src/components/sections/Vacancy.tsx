"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, Mail } from "lucide-react";

export default function Vacancy() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById("vacancy");
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="vacancy" className="py-20 sm:py-28 bg-white border-t border-slate-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div
          className={`transition-all duration-600 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-brand-blue/10 flex items-center justify-center mx-auto mb-6">
            <Briefcase className="h-7 w-7 text-brand-blue" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Vacancy
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Interested in joining our team? We are always looking for talented educators and developers to help students achieve their SAT goals.
          </p>
          <Link
            href="/support"
            className="mt-8 inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-brand-orange hover:bg-brand-orange/90 rounded-xl transition-colors"
          >
            <Mail className="h-4 w-4" />
            Get in touch
          </Link>
        </div>
      </div>
    </section>
  );
}
