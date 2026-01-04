"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MobileMenu from "./mobile-menu";

export default function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

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
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo - Inspired by unlockadmissions.uz with orange accent */}
            <Link
              href="/"
              onClick={(e) => isHomePage && handleScrollTo(e, "home")}
              className="flex items-center space-x-3 group"
            >
              <div className="bg-orange-500 w-10 h-10 rounded flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900 leading-none">
                  SAT
                </span>
                <span className="text-sm font-medium text-gray-700 leading-none">
                  Ziyo
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a
                href={isHomePage ? "#features" : "/#features"}
                onClick={(e) => handleScrollTo(e, "features")}
                className="text-gray-700 hover:text-orange-500 transition-colors font-medium relative group cursor-pointer"
              >
                Features
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 transition-all group-hover:w-full"></span>
              </a>
              <a
                href={isHomePage ? "#how-it-works" : "/#how-it-works"}
                onClick={(e) => handleScrollTo(e, "how-it-works")}
                className="text-gray-700 hover:text-orange-500 transition-colors font-medium relative group cursor-pointer"
              >
                How It Works
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 transition-all group-hover:w-full"></span>
              </a>
              <a
                href={isHomePage ? "#pricing" : "/#pricing"}
                onClick={(e) => handleScrollTo(e, "pricing")}
                className="text-gray-700 hover:text-orange-500 transition-colors font-medium relative group cursor-pointer"
              >
                Pricing
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 transition-all group-hover:w-full"></span>
              </a>
              <a
                href={isHomePage ? "#testimonials" : "/#testimonials"}
                onClick={(e) => handleScrollTo(e, "testimonials")}
                className="text-gray-700 hover:text-orange-500 transition-colors font-medium relative group cursor-pointer"
              >
                Testimonials
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 transition-all group-hover:w-full"></span>
              </a>
              <Link
                href="/score-calculator"
                className="text-gray-700 hover:text-orange-500 transition-colors font-medium relative group cursor-pointer"
              >
                Score Calculator
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 transition-all group-hover:w-full"></span>
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-gray-700 hover:text-orange-500 transition-colors font-medium hidden sm:block"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm shadow-md hover:shadow-lg"
              >
                Get Started
              </Link>
              <MobileMenu />
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}
