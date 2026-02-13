"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

// Satashkent-style: Results, Why us, Courses, Platform, Teachers, FAQ, Vacancy
const NAV_LINKS = [
  { id: "results", label: "Results" },
  { id: "why-us", label: "Why us" },
  { id: "courses", label: "Courses" },
  { id: "platform", label: "Platform" },
  { id: "teachers", label: "Teachers" },
  { id: "faq", label: "FAQ" },
  { id: "vacancy", label: "Vacancy" },
];

export default function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (!isHomePage) return;
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-white transition-all duration-300 border-b ${
        scrolled ? "border-slate-200 shadow-sm" : "border-slate-100"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 lg:h-[72px] items-center justify-between gap-8">
          {/* Logo – Satashkent: left, logo + brand name */}
          <Link
            href="/"
            className="flex items-center gap-3 shrink-0"
            onClick={(e) => isHomePage && scrollTo(e, "home")}
          >
            <Image
              src="/logo.png"
              alt="SAT Ziyo"
              width={44}
              height={44}
              className="object-contain"
              priority
            />
            <span className="text-xl font-bold tracking-tight text-slate-900">
              SAT Ziyo
            </span>
          </Link>

          {/* Center nav – Satashkent: Results, Why us, Courses, Platform, Teachers, FAQ, Vacancy */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8 flex-1 justify-center flex-wrap">
            {NAV_LINKS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => scrollTo(e, item.id)}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Right – Sign In + CTA like "Enroll for a class" */}
          <div className="flex items-center gap-4 shrink-0">
            <Link
              href="/auth/login"
              className="hidden sm:inline-flex text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-brand-orange hover:bg-brand-orange/90 rounded-lg transition-colors shadow-sm"
            >
              Get Started
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden py-4 border-t border-slate-100 bg-white">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => scrollTo(e, item.id)}
                  className="px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  {item.label}
                </a>
              ))}
              <Link
                href="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
