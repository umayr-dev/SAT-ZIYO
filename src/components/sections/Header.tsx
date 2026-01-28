"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollTo = (
    e: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string
  ) => {
    if (isHomePage) {
      e.preventDefault();
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
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled ? "bg-white shadow-md" : "bg-transparent"
        }`}
      >
        {/* Nav with container inside - full width header, container in nav */}
        <nav className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo with image */}
            <Link
              href="/"
              onClick={(e) => isHomePage && handleScrollTo(e, "home")}
              className="flex items-center space-x-3 group"
            >
              <div className="relative w-12 h-12">
                <Image
                  src="/logo.png"
                  alt="SAT Ziyo Logo"
                  width={48}
                  height={48}
                  className="object-contain rounded-xl group-hover:scale-105 transition-transform"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-none">
                  SAT Ziyo
                </span>
                <span className="text-xs font-medium text-gray-500 leading-none mt-0.5">
                  Digital SAT Prep
                </span>
              </div>
            </Link>

            {/* Navigation Links - Modern design */}
            <div className="hidden lg:flex items-center space-x-1">
              <a
                href={isHomePage ? "#home" : "/#home"}
                onClick={(e) => handleScrollTo(e, "home")}
                className="px-4 py-2 text-gray-700 hover:text-orange-600 transition-colors font-medium rounded-lg hover:bg-orange-50 relative group cursor-pointer"
              >
                Home
              </a>
              <a
                href={isHomePage ? "#features" : "/#features"}
                onClick={(e) => handleScrollTo(e, "features")}
                className="px-4 py-2 text-gray-700 hover:text-orange-600 transition-colors font-medium rounded-lg hover:bg-orange-50 relative group cursor-pointer"
              >
                Features
              </a>
              <a
                href={isHomePage ? "#how-it-works" : "/#how-it-works"}
                onClick={(e) => handleScrollTo(e, "how-it-works")}
                className="px-4 py-2 text-gray-700 hover:text-orange-600 transition-colors font-medium rounded-lg hover:bg-orange-50 relative group cursor-pointer"
              >
                How It Works
              </a>
              <a
                href={isHomePage ? "#pricing" : "/#pricing"}
                onClick={(e) => handleScrollTo(e, "pricing")}
                className="px-4 py-2 text-gray-700 hover:text-orange-600 transition-colors font-medium rounded-lg hover:bg-orange-50 relative group cursor-pointer"
              >
                Pricing
              </a>
              <a
                href={isHomePage ? "#testimonials" : "/#testimonials"}
                onClick={(e) => handleScrollTo(e, "testimonials")}
                className="px-4 py-2 text-gray-700 hover:text-orange-600 transition-colors font-medium rounded-lg hover:bg-orange-50 relative group cursor-pointer"
              >
                Testimonials
              </a>
              <Link
                href="/score-calculator"
                className="px-4 py-2 text-gray-700 hover:text-orange-600 transition-colors font-medium rounded-lg hover:bg-orange-50 relative group cursor-pointer"
              >
                Score Calculator
              </Link>
            </div>

            {/* CTA Buttons - Modern design */}
            <div className="flex items-center space-x-3">
              <Link
                href="/auth/login"
                className="hidden sm:block px-4 py-2 text-gray-700 hover:text-orange-600 transition-colors font-medium rounded-lg hover:bg-gray-50"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-105 transform"
              >
                Get Started
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-700 hover:text-orange-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div
              className={`lg:hidden py-4 border-t border-gray-200 animate-in slide-in-from-top-2`}
            >
              <div className="flex flex-col space-y-2">
                <a
                  href={isHomePage ? "#home" : "/#home"}
                  onClick={(e) => handleScrollTo(e, "home")}
                  className="px-4 py-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium"
                >
                  Home
                </a>
                <a
                  href={isHomePage ? "#features" : "/#features"}
                  onClick={(e) => handleScrollTo(e, "features")}
                  className="px-4 py-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium"
                >
                  Features
                </a>
                <a
                  href={isHomePage ? "#how-it-works" : "/#how-it-works"}
                  onClick={(e) => handleScrollTo(e, "how-it-works")}
                  className="px-4 py-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium"
                >
                  How It Works
                </a>
                <a
                  href={isHomePage ? "#pricing" : "/#pricing"}
                  onClick={(e) => handleScrollTo(e, "pricing")}
                  className="px-4 py-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium"
                >
                  Pricing
                </a>
                <a
                  href={isHomePage ? "#testimonials" : "/#testimonials"}
                  onClick={(e) => handleScrollTo(e, "testimonials")}
                  className="px-4 py-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium"
                >
                  Testimonials
                </a>
                <Link
                  href="/score-calculator"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium"
                >
                  Score Calculator
                </Link>
                <div className="pt-2 border-t border-gray-200 mt-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>
    </>
  );
}
