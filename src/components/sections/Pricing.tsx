"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/src/ui/button";

export default function Pricing() {
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

    const element = document.getElementById("pricing");
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "100 Practice Questions",
        "Basic Progress Tracking",
        "Limited Test Simulations",
        "Community Support",
      ],
      cta: "Get Started Free",
      href: "/auth/register",
      popular: false,
    },
    {
      name: "Premium",
      price: "$19",
      period: "per month",
      description: "Best for serious students",
      features: [
        "10,000+ Practice Questions",
        "Advanced Analytics",
        "Unlimited Test Simulations",
        "Detailed Explanations",
        "Priority Support",
        "Mobile App Access",
      ],
      cta: "Start Premium",
      href: "/auth/register?plan=premium",
      popular: true,
    },
    {
      name: "Pro",
      price: "$49",
      period: "per month",
      description: "For maximum results",
      features: [
        "Everything in Premium",
        "1-on-1 Tutoring Sessions",
        "Custom Study Plans",
        "Performance Predictions",
        "24/7 Support",
        "Early Access to Features",
      ],
      cta: "Go Pro",
      href: "/auth/register?plan=pro",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`mx-auto max-w-2xl text-center mb-16 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Select the perfect plan for your SAT preparation journey
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative transition-all duration-700 delay-${
                index * 100
              } ${
                isVisible
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 translate-y-10 scale-95"
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}
              <div
                className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all h-full border-2 ${
                  plan.popular
                    ? "border-orange-500 scale-105"
                    : "border-gray-200"
                }`}
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-extrabold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600">/{plan.period}</span>
                  </div>
                  <p className="mt-2 text-gray-600">{plan.description}</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className="block">
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "bg-gray-900 hover:bg-gray-800"
                    }`}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
