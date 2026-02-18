"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Footer() {
  const [lang, setLang] = useState<"en" | "uz">("en");
  const [cookiesAccepted, setCookiesAccepted] = useState(false);

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem("satziyo_cookies_accepted")
        : null;
    if (stored === "1") setCookiesAccepted(true);
  }, []);

  const acceptCookies = () => {
    setCookiesAccepted(true);
    if (typeof window !== "undefined")
      localStorage.setItem("satziyo_cookies_accepted", "1");
  };

  return (
    <footer className="bg-[#0a0a0a] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-14">
        {/* Top row: Language + Links - imkon.org layout */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 md:gap-10">
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-500 uppercase tracking-widest">
              {lang === "en" ? "Language" : "Til"}
            </span>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`text-sm transition-colors ${lang === "en" ? "text-white font-medium" : "text-neutral-500 hover:text-neutral-300"}`}
            >
              English
            </button>
            <span className="text-neutral-600">|</span>
            <button
              type="button"
              onClick={() => setLang("uz")}
              className={`text-sm transition-colors ${lang === "uz" ? "text-white font-medium" : "text-neutral-500 hover:text-neutral-300"}`}
            >
              O&apos;zbekcha
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-12">
            <div>
              <h3 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.2em] mb-4">
                {lang === "en" ? "Information" : "Ma'lumot"}
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/#why-us"
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {lang === "en" ? "About us" : "Biz haqimizda"}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#courses"
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {lang === "en" ? "Programs" : "Dasturlar"}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/score-calculator"
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {lang === "en" ? "Score calculator" : "Ball kalkulyatori"}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#faq"
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/oferta"
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {lang === "en" ? "Public offer" : "Oferta"}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.2em] mb-4">
                {lang === "en" ? "Programs" : "Dasturlar"}
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/dashboard/practice"
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {lang === "en" ? "Practice tests" : "Amaliy testlar"}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/score-calculator"
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {lang === "en" ? "Score calculator" : "Ball kalkulyatori"}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support"
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {lang === "en" ? "Help center" : "Yordam"}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.2em] mb-4">
                {lang === "en" ? "About" : "Biz haqimizda"}
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/#teachers"
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {lang === "en" ? "Mentors" : "Mentorlar"}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#testimonials"
                    className="text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    {lang === "en" ? "Testimonials" : "Sharhlar"}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright line - imkon style */}
        <div className="mt-10 pt-6 border-t border-neutral-800/80">
          <p className="text-sm text-neutral-500 lowercase tracking-wide">
            © {new Date().getFullYear()} SAT Ziyo
          </p>
        </div>
      </div>
    </footer>
  );
}
