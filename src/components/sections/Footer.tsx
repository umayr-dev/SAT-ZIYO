import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl font-bold text-white">SAT</span>
              <span className="text-2xl font-bold text-blue-400">Ziyo</span>
            </div>
            <p className="text-gray-400 max-w-md">
              Your comprehensive SAT preparation platform. Master English and
              Math with practice tests and detailed explanations.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/practice"
                  className="hover:text-blue-400 transition-colors"
                >
                  Practice Tests
                </Link>
              </li>
              <li>
                <Link
                  href="/tests"
                  className="hover:text-blue-400 transition-colors"
                >
                  Full Tests
                </Link>
              </li>
              <li>
                <Link
                  href="/results"
                  className="hover:text-blue-400 transition-colors"
                >
                  Results
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="hover:text-blue-400 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-blue-400 transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="hover:text-blue-400 transition-colors"
                >
                  Help Center
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} SAT Ziyo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
