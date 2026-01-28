"use client";

import { useEffect, useState } from "react";

export default function Statistics() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById("statistics");
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);
  const stats = [
    {
      number: "10,000+",
      label: "Practice Questions",
      description: "Comprehensive question bank",
    },
    {
      number: "50,000+",
      label: "Active Students",
      description: "Trusted by students worldwide",
    },
    {
      number: "95%",
      label: "Success Rate",
      description: "Students improve their scores",
    },
    {
      number: "24/7",
      label: "Available",
      description: "Practice anytime, anywhere",
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`text-center transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 translate-y-10 scale-90"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="text-4xl md:text-5xl font-bold mb-2">
                {stat.number}
              </div>
              <div className="text-lg font-semibold mb-1">{stat.label}</div>
              <div className="text-sm text-orange-100">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
