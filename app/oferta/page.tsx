import Header from "@/src/components/sections/Header";
import Footer from "@/src/components/sections/Footer";
import Link from "next/link";
import { FileText, Download } from "lucide-react";

export const metadata = {
  title: "Public Offer (Oferta) | SAT Ziyo",
  description:
    "Public offer, refund and exchange policy, and payment terms for SAT Ziyo in accordance with e‑commerce requirements.",
};

export default function OfertaPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8 text-xs sm:text-sm leading-relaxed">
        <h1 className="text-xl font-semibold text-slate-900 mb-3">
          Public offer (Oferta)
        </h1>
        <p className="text-slate-600 mb-4">
          This page provides a short summary of the main terms for using the SAT Ziyo platform.
          The legally binding text of the public offer is contained in the PDF below – please read
          it carefully before making a payment.
        </p>

        {/* Payment block – WITHOUT currency conversion wording */}
        <section className="mt-4 mb-6 space-y-2">
          <h2 className="text-sm font-semibold text-slate-900">
            Payment and prices
          </h2>
          <p className="text-slate-700">
            All prices for services and goods on this site are indicated in{" "}
            <strong>Uzbek soum (UZS)</strong>. Payments are accepted in UZS through licensed payment
            providers (for example, Payme and other local payment systems).
          </p>
          <p className="text-slate-600">
            We <strong>do not peg prices to foreign currency or conditional units</strong>. If any
            reference to foreign currency appears on the site, it is for information only. All
            settlements with users are performed in UZS in accordance with the Law on Currency
            Regulation and the Law on E‑commerce of the Republic of Uzbekistan.
          </p>
        </section>

        {/* Short summary of key policies (full text – in PDF) */}
        <section className="mt-2 mb-8 space-y-2">
          <h2 className="text-sm font-semibold text-slate-900">
            Refunds, exchange and guarantees (summary)
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
            <li>
              <strong>Digital services and access to materials.</strong> Access to online courses,
              tests and other digital content is provided after successful payment. The access
              period and scope of services are specified on the relevant product or tariff page.
            </li>
            <li>
              <strong>Refunds and cancellation.</strong> Refunds are made only in the cases and
              within the procedure described in the full public offer (PDF). As a rule, refunds for
              already rendered digital services and fully used access periods are not provided,
              except where directly required by law.
            </li>
            <li>
              <strong>Exchange of goods.</strong> If the platform offers physical goods (books,
              printed materials, etc.), the terms of exchange and return, time limits and conditions
              for preserving consumer properties of goods are defined in the full offer in
              accordance with consumer protection legislation.
            </li>
            <li>
              <strong>Guarantees.</strong> We guarantee the provision of access to the paid
              materials and services within the announced time frames and scope. At the same time,
              <u>we do not guarantee</u> specific results on the SAT or other exams (score,
              admission, etc.), since they depend on many individual factors beyond our control.
            </li>
            <li>
              <strong>Support.</strong> In case of technical problems with access or payment, you
              can contact support through the contacts indicated on the site. We will make
              reasonable efforts to restore access or, where appropriate, provide a proportional
              refund in accordance with the rules of the offer.
            </li>
          </ul>
          <p className="mt-2 text-slate-500">
            This section is provided for convenience only. In case of any discrepancies, the text of
            the public offer in the PDF prevails.
          </p>
        </section>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          {/* Асосий (ру/ен) oferta PDF */}
          <div className="flex items-center gap-2">
            <a
              href="/satziyo%20oferta.pdf"
              target="_blank"
              rel="noopener noreferrer"
              download="satziyo-oferta.pdf"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-blue text-white font-medium rounded-lg hover:bg-brand-blue/90 transition-colors text-xs sm:text-sm"
            >
              <Download className="w-4 h-4" />
              Download offer (RU/EN, PDF)
            </a>
            <a
              href="/satziyo%20oferta.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors text-[11px] sm:text-xs"
            >
              <FileText className="w-4 h-4" />
              Open online
            </a>
          </div>

          {/* O'zbek tilidagi yangi oferta PDF */}
          <div className="flex items-center gap-2">
            <a
              href="/satziyo-oferta.pdf"
              target="_blank"
              rel="noopener noreferrer"
              download="satziyo-oferta-uz.pdf"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900 transition-colors text-xs sm:text-sm"
            >
              <Download className="w-4 h-4" />
              Yuklab olish (UZ, PDF)
            </a>
            <a
              href="/satziyo-oferta.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors text-[11px] sm:text-xs"
            >
              <FileText className="w-4 h-4" />
              Onlayn ko‘rish (UZ)
            </a>
          </div>
        </div>

        <p className="mt-6 text-xs sm:text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-700 underline">
            ← Back to home
          </Link>
        </p>
      </div>
      <Footer />
    </main>
  );
}
