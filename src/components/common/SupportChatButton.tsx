"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

export function SupportChatButton() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide on dashboard page
  if (pathname === "/dashboard") {
    return null;
  }

  const handleChatClick = () => {
    router.push("/support");
  };

  return (
    <button
      onClick={handleChatClick}
      className="fixed bottom-6 right-6 z-40 p-3 sm:p-4 bg-blue-900 text-white rounded-full shadow-lg hover:bg-blue-800 transition-all duration-300 hover:scale-110 hover:shadow-xl group"
      aria-label="Open support"
    >
      <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform" />
    </button>
  );
}
