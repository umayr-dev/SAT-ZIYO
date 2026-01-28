"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/src/ui/button";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  const handleScrollTo = (sectionId: string) => {
    setIsOpen(false);
    if (isHomePage) {
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          const headerOffset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition =
            elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }, 100);
    }
  };

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b shadow-lg z-40">
          <nav className="max-w-[1440px] mx-auto px-4 py-4 space-y-4">
            <a
              href={isHomePage ? "#features" : "/#features"}
              onClick={() => handleScrollTo("features")}
              className="block text-gray-700 hover:text-orange-500 transition-colors font-medium py-2 cursor-pointer"
            >
              Features
            </a>
            <a
              href={isHomePage ? "#how-it-works" : "/#how-it-works"}
              onClick={() => handleScrollTo("how-it-works")}
              className="block text-gray-700 hover:text-orange-500 transition-colors font-medium py-2 cursor-pointer"
            >
              How It Works
            </a>
            <a
              href={isHomePage ? "#pricing" : "/#pricing"}
              onClick={() => handleScrollTo("pricing")}
              className="block text-gray-700 hover:text-orange-500 transition-colors font-medium py-2 cursor-pointer"
            >
              Pricing
            </a>
            <a
              href={isHomePage ? "#testimonials" : "/#testimonials"}
              onClick={() => handleScrollTo("testimonials")}
              className="block text-gray-700 hover:text-orange-500 transition-colors font-medium py-2 cursor-pointer"
            >
              Testimonials
            </a>
            <Link
              href="/score-calculator"
              className="block text-gray-700 hover:text-orange-500 transition-colors font-medium py-2"
              onClick={() => setIsOpen(false)}
            >
              Score Calculator
            </Link>
            <div className="pt-4 border-t space-y-2">
              <Link
                href="/auth/login"
                className="block text-gray-700 hover:text-blue-600 transition-colors font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="block w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-center"
                onClick={() => setIsOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
