"use client";

import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

export function TopToScrollButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled down 300px
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 sm:p-3.5 bg-blue-900 text-white rounded-full shadow-lg hover:bg-blue-800 transition-all duration-300 hover:scale-110 hover:shadow-xl group"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-5 w-5 sm:h-6 sm:w-6 group-hover:animate-bounce" />
        </button>
      )}
    </>
  );
}
