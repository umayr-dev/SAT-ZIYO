"use client";

import { useEffect, useState } from "react";
import { BookOpen, Lightbulb, BarChart3, Clock } from "lucide-react";

export default function Features() {
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

    const element = document.getElementById("features");
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);
  const features = [
    {
      title: "Comprehensive Practice",
      description:
        "Access thousands of SAT questions covering all topics in English and Math sections.",
      icon: BookOpen,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    },
    {
      title: "Detailed Explanations",
      description:
        "Understand every answer with step-by-step explanations and solution strategies.",
      icon: Lightbulb,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Progress Tracking",
      description:
        "Monitor your improvement with detailed analytics and performance insights.",
      icon: BarChart3,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Real Test Simulation",
      description:
        "Practice with full-length tests that simulate the actual SAT exam experience.",
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Everything you need to ace the SAT
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Comprehensive tools and resources to help you achieve your target
            score
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className={`relative rounded-2xl bg-white p-8 border border-gray-200 hover:border-orange-300 hover:shadow-xl transition-all duration-500 group ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div
                  className={`w-16 h-16 ${feature.bgColor} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                >
                  <Icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
