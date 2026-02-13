import Header from "@/src/components/sections/Header";
import Footer from "@/src/components/sections/Footer";
import Link from "next/link";
import { FileText, Download } from "lucide-react";

export const metadata = {
  title: "Public Offer (Oferta) | SAT Ziyo",
  description: "Public offer and terms of use for SAT Ziyo. Payment terms and Central Bank rate conversion.",
};

export default function OfertaPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
          Public offer (Oferta)
        </h1>
        <p className="text-slate-600 mb-8">
          Terms of use and payment. You can read the full text in the PDF below or download it.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Payment and currency
          </h2>
          <p className="text-slate-700 leading-relaxed mb-2">
            The Premium subscription is <strong>$15 (fifteen US dollars) per month</strong>. Payments
            are processed via Payme. Amounts in US dollars are{" "}
            <strong>
              converted into local currency (UZS) at the Central Bank of the Republic of Uzbekistan
              exchange rate applicable on the date of the charge (or at another legally applicable
              rate).
            </strong>
          </p>
          <p className="text-slate-600 text-sm">
            Services paid in foreign currency (USD) are converted into Uzbekistani soums at the
            Central Bank of the Republic of Uzbekistan rate on the date the funds are debited from
            the user&apos;s card.
          </p>
        </div>

        <a
          href="/satziyo%20oferta.pdf"
          target="_blank"
          rel="noopener noreferrer"
          download="satziyo-oferta.pdf"
          className="inline-flex items-center gap-2 px-5 py-3 bg-brand-blue text-white font-medium rounded-xl hover:bg-brand-blue/90 transition-colors"
        >
          <Download className="w-5 h-5" />
          Download full offer (PDF)
        </a>
        <span className="mx-2 text-slate-400">or</span>
        <a
          href="/satziyo%20oferta.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 border-2 border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
        >
          <FileText className="w-5 h-5" />
          Open in new tab
        </a>

        <p className="mt-8 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-700 underline">
            ← Back to home
          </Link>
        </p>
      </div>
      <Footer />
    </main>
  );
}
