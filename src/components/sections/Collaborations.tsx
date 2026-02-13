"use client";

import { useEffect, useState } from "react";

// Freshman-style: "Collaborations" – We connect you with top instructors from around the world
const CITIES = [
  "Tashkent, Uzbekistan",
  "Samarqand, Uzbekistan",
  "Almaty, Kazakhstan",
  "Astana, Kazakhstan",
  "New York, USA",
  "Boston, USA",
  "Singapore",
  "Istanbul, Turkey",
];

export default function Collaborations() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById("collaborations");
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="collaborations" className="py-20 sm:py-28 bg-white border-t border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`max-w-2xl mx-auto text-center mb-12 transition-all duration-600 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Collaborations
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            We connect you with top instructors from around the world, providing a truly global learning environment.
          </p>
        </div>
        <div
          className={`flex flex-wrap justify-center gap-4 sm:gap-6 transition-all duration-600 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "100ms" }}
        >
          {CITIES.map((city, i) => (
            <span
              key={city}
              className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-sm font-medium"
            >
              {city}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
