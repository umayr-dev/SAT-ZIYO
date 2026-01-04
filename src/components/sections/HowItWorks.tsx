"use client";

import { useEffect, useState } from "react";
import { Play, BookOpen, Award, TrendingUp } from "lucide-react";

export default function HowItWorks() {
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

    const element = document.getElementById("how-it-works");
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  const steps = [
    {
      number: "01",
      title: "Sign Up",
      description:
        "Create your free account and get instant access to thousands of practice questions.",
      icon: Play,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    },
    {
      number: "02",
      title: "Practice",
      description:
        "Take practice tests and solve questions covering all SAT topics in English and Math.",
      icon: BookOpen,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      number: "03",
      title: "Track Progress",
      description:
        "Monitor your performance with detailed analytics and identify areas for improvement.",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      number: "04",
      title: "Ace the Test",
      description:
        "Achieve your target score with comprehensive preparation and real test simulations.",
      icon: Award,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`mx-auto max-w-2xl text-center mb-16 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Get started in 4 simple steps and start improving your SAT score
            today
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className={`relative transition-all duration-700 delay-${
                  index * 100
                } ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 h-full">
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`w-16 h-16 ${step.bgColor} rounded-xl flex items-center justify-center`}
                    >
                      <Icon className={`h-8 w-8 ${step.color}`} />
                    </div>
                    <span className="text-4xl font-bold text-gray-200">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
