"use client";

import { useEffect, useState } from "react";
import { practiceService } from "@/src/services/practice.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/ui/dialog";
import { Button } from "@/src/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/ui/card";
import { BookOpen, Loader2, X } from "lucide-react";
import { ScrollArea } from "@/src/ui/scroll-area";

interface Formula {
  id: string;
  name: string;
  formula: string;
  description: string | null;
  imageUrl: string | null;
}

interface MathFormulasSheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MathFormulasSheet({ open, onOpenChange }: MathFormulasSheetProps) {
  const [formulas, setFormulas] = useState<Record<string, Formula[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(open || false);

  useEffect(() => {
    if (isOpen && Object.keys(formulas).length === 0) {
      loadFormulas();
    }
  }, [isOpen]);

  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  const normalizeFormulas = (raw: unknown): Record<string, Formula[]> => {
    if (Array.isArray(raw)) {
      const byCategory: Record<string, Formula[]> = {};
      for (const item of raw) {
        if (item && typeof item === "object" && "id" in item) {
          const cat = (item as Formula & { category?: string }).category ?? "Formulas";
          if (!byCategory[cat]) byCategory[cat] = [];
          byCategory[cat].push(item as Formula);
        }
      }
      return byCategory;
    }
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const out: Record<string, Formula[]> = {};
      for (const key of Object.keys(raw)) {
        const val = (raw as Record<string, unknown>)[key];
        if (Array.isArray(val)) {
          out[key] = val as Formula[];
        } else if (val && typeof val === "object" && !Array.isArray(val)) {
          out[key] = [val as Formula];
        } else {
          out[key] = [];
        }
      }
      return out;
    }
    return {};
  };

  const loadFormulas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await practiceService.getMathFormulas();
      setFormulas(normalizeFormulas(data));
    } catch (err) {
      console.error("Failed to load math formulas:", err);
      setError("Failed to load formulas");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  const categories = Object.keys(formulas).filter((c) => Array.isArray(formulas[c]) && formulas[c].length > 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200">
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            SAT Math Reference Sheet
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-600">{error}</div>
            ) : categories.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No formulas available
              </div>
            ) : (
              <div className="space-y-6">
                {categories.map((category) => (
                  <Card key={category} className="bg-white border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {formulas[category].map((formula) => (
                          <div
                            key={formula.id}
                            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="font-semibold text-gray-900 mb-2">
                              {formula.name}
                            </div>
                            <div className="text-lg font-mono text-gray-800 mb-2">
                              {formula.formula}
                            </div>
                            {formula.description && (
                              <div className="text-sm text-gray-600">
                                {formula.description}
                              </div>
                            )}
                            {formula.imageUrl && (
                              <img
                                src={formula.imageUrl}
                                alt={formula.name}
                                className="mt-2 max-w-full h-auto rounded"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

