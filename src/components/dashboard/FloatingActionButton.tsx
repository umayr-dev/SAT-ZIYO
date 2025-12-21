"use client";

import { BookOpen } from "lucide-react";
import { Button } from "@/src/ui/button";

export function FloatingActionButton() {
  return (
    <Button
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg z-50"
      size="icon"
    >
      <BookOpen className="h-6 w-6" />
    </Button>
  );
}
