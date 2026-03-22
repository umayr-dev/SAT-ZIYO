"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const CLASSROOM_URL = "https://my-math-academy.com/classroom/";

const NAV_LINKS = [
  { id: "results", label: "Results" },
  { id: "why-us", label: "About us" },
  { id: "courses", label: "Courses" },
  { id: "platform", label: "Score calculator" },
  { id: "teachers", label: "Mentors" },
  { id: "faq", label: "FAQ" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
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

          {/* Center nav */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8 flex-1 justify-center flex-wrap">
            {NAV_LINKS.map((item) => {
              const isScoreCalculator = item.id === "platform";
              const href = isScoreCalculator ? "/score-calculator" : `#${item.id}`;

              const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
                if (isScoreCalculator) {
                  e.preventDefault();
                  router.push("/score-calculator");
                  setMobileOpen(false);
                } else {
                  scrollTo(e, item.id);
                }
              };

              return (
                <a
                  key={item.id}
                  href={href}
                  onClick={handleClick}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap"
                >
                  {item.label}
                </a>
              );
            })}
            <a
              href={CLASSROOM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Classroom
            </a>
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
              {NAV_LINKS.map((item) => {
                const isScoreCalculator = item.id === "platform";
                const href = isScoreCalculator ? "/score-calculator" : `#${item.id}`;

                const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
                  if (isScoreCalculator) {
                    e.preventDefault();
                    router.push("/score-calculator");
                    setMobileOpen(false);
                  } else {
                    scrollTo(e, item.id);
                  }
                };

                return (
                  <a
                    key={item.id}
                    href={href}
                    onClick={handleClick}
                    className="px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    {item.label}
                  </a>
                );
              })}
              <a
                href={CLASSROOM_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                Classroom
              </a>
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
