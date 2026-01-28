import Link from "next/link";
import { Button } from "@/src/ui/button";

export default function CTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Ready to Ace Your SAT?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Start practicing today and join thousands of students improving
            their scores
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button
                size="lg"
                className="bg-white text-orange-500 hover:bg-gray-100 font-semibold px-8 py-6 text-lg"
              >
                Get Started Free
              </Button>
            </Link>
            <Link href="/practice">
              <Button
                size="lg"
                className="border-2 border-white !text-white bg-transparent hover:bg-white/10 hover:!text-white font-semibold px-8 py-6 text-lg"
              >
                Try Practice Test
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
