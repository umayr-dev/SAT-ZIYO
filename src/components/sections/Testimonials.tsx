"use client";

import { useEffect, useState } from "react";

export default function Testimonials() {
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

    const element = document.getElementById("testimonials");
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "High School Student",
      content:
        "This platform helped me improve my SAT score by 200 points! The practice tests are incredibly realistic and the explanations are clear.",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "College Applicant",
      content:
        "The detailed analytics helped me identify my weak areas. I focused on those topics and saw significant improvement in just a few weeks.",
      rating: 5,
    },
    {
      name: "Emily Rodriguez",
      role: "Student",
      content:
        "I love how I can practice anytime, anywhere. The mobile-friendly design makes it easy to study on the go. Highly recommended!",
      rating: 5,
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            What Students Say
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Join thousands of students who have improved their SAT scores
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">
                    ★
                  </span>
                ))}
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed">
                <span>&ldquo;</span>
                {testimonial.content}
                <span>&rdquo;</span>
              </p>
              <div className="border-t pt-4">
                <div className="font-semibold text-gray-900">
                  {testimonial.name}
                </div>
                <div className="text-sm text-gray-600">{testimonial.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
