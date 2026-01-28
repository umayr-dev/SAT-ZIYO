# Matematik Ifodalar Render Qilish Qo'llanmasi

## 1. LaTeX/MathJax qo'llab-quvvatlashni qo'shish

### O'rnatish

```bash
npm install react-katex katex
npm install --save-dev @types/katex
```

### Komponent yaratish

`src/components/math/MathRenderer.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathRendererProps {
  content: string;
  displayMode?: boolean;
  className?: string;
}

export function MathRenderer({ 
  content, 
  displayMode = false,
  className = "" 
}: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // LaTeX formatini render qilish
      katex.render(content, containerRef.current, {
        displayMode,
        throwOnError: false,
        errorColor: "#cc0000",
      });
    } catch (error) {
      console.error("KaTeX render error:", error);
      // Xato bo'lsa, oddiy matn ko'rsatish
      if (containerRef.current) {
        containerRef.current.textContent = content;
      }
    }
  }, [content, displayMode]);

  return <div ref={containerRef} className={className} />;
}
```

### QuestionDisplay komponentida ishlatish

`src/components/practice/QuestionDisplay.tsx` ga qo'shing:

```tsx
import { MathRenderer } from "@/src/components/math/MathRenderer";

// questionText render qilishda:
{question.questionText ? (
  <div className="text-base text-gray-900 leading-relaxed">
    {parseMathContent(question.questionText)}
  </div>
) : (
  <span className="text-gray-500 italic">No question text available</span>
)}
```

### Math content parser

```tsx
function parseMathContent(text: string) {
  // LaTeX format: $...$ (inline) yoki $$...$$ (display)
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // Inline math: $...$
  const inlineRegex = /\$([^$]+)\$/g;
  let match;
  
  while ((match = inlineRegex.exec(text)) !== null) {
    // Match oldingi matn
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Math ifoda
    parts.push(
      <MathRenderer 
        key={`inline-${match.index}`} 
        content={match[1]} 
        displayMode={false}
        className="inline-block"
      />
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Qolgan matn
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : text;
}
```

## 2. PDF'dan ma'lumotlarni import qilish

### PDF parser o'rnatish

```bash
npm install pdf-parse pdfjs-dist
```

### PDF import API route

`app/api/admin/tests/import-pdf/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file || file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PDF." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdf(buffer);
    
    // PDF matnini parse qilish
    const questions = parsePDFContent(data.text);
    
    return NextResponse.json({ 
      success: true, 
      questions,
      total: questions.length 
    });
  } catch (error) {
    console.error("PDF import error:", error);
    return NextResponse.json(
      { error: "Failed to parse PDF" },
      { status: 500 }
    );
  }
}

function parsePDFContent(text: string) {
  const questions: any[] = [];
  
  // PDF formatiga qarab parse qilish
  // Masalan: "Question 1: ..." formatida bo'lsa
  const questionRegex = /Question\s+(\d+):\s*(.+?)(?=Question\s+\d+:|$)/gs;
  
  let match;
  while ((match = questionRegex.exec(text)) !== null) {
    const questionText = match[2].trim();
    // Choices va boshqa ma'lumotlarni extract qilish
    // Bu PDF formatiga bog'liq
    
    questions.push({
      questionText,
      orderIndex: parseInt(match[1]) - 1,
      difficulty: "MEDIUM",
      questionType: "MULTIPLE_CHOICE",
      choices: [], // PDF'dan extract qilish kerak
    });
  }
  
  return questions;
}
```

### Frontend import komponenti

`app/admin/tests/[testId]/import/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/ui/button";
import { Card } from "@/src/ui/card";
import { Input } from "@/src/ui/input";

export default function ImportPDFPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/tests/import-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Import error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Import Questions from PDF</h2>
      
      <div className="space-y-4">
        <Input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
        />
        
        <Button onClick={handleImport} disabled={!file || loading}>
          {loading ? "Importing..." : "Import PDF"}
        </Button>
        
        {result && (
          <div className="mt-4 p-4 bg-green-50 rounded">
            <p>Successfully imported {result.total} questions</p>
          </div>
        )}
      </div>
    </Card>
  );
}
```

## 3. Database'ga qo'shish

### Batch import API

`app/api/admin/tests/[testId]/questions/batch/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/src/config/api";

export async function POST(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const { testId } = params;
    const { questions, moduleId } = await request.json();
    
    // Har bir savolni database'ga qo'shish
    const results = await Promise.all(
      questions.map(async (question: any) => {
        const response = await fetch(
          `${API_CONFIG.baseURL}/tests/modules/${moduleId}/questions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(question),
          }
        );
        
        return response.json();
      })
    );
    
    return NextResponse.json({
      success: true,
      imported: results.length,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to import questions" },
      { status: 500 }
    );
  }
}
```

## 4. Foydalanish

### LaTeX formatida savol qo'shish:

```json
{
  "questionText": "What is the value of $x$ if $2x + 5 = 15$?",
  "choices": [
    { "choiceText": "$x = 3$", "isCorrect": false },
    { "choiceText": "$x = 5$", "isCorrect": true },
    { "choiceText": "$x = 7$", "isCorrect": false }
  ]
}
```

### Murakkab formulalar:

```json
{
  "questionText": "What is the derivative of $f(x) = x^2 + 3x$?",
  "choices": [
    { "choiceText": "$f'(x) = 2x + 3$", "isCorrect": true },
    { "choiceText": "$f'(x) = x + 3$", "isCorrect": false }
  ]
}
```

### Display mode (katta formulalar):

```json
{
  "questionText": "Solve: $$\\int_0^1 x^2 dx$$",
  "choices": [
    { "choiceText": "$\\frac{1}{3}$", "isCorrect": true }
  ]
}
```

## 5. PDF format talablari

PDF fayl quyidagi formatda bo'lishi kerak:

```
Question 1: What is 2 + 2?
A) 3
B) 4
C) 5
D) 6
Correct: B

Question 2: What is the square root of 16?
A) 2
B) 4
C) 8
D) 16
Correct: B
```

Yoki JSON formatida:

```json
[
  {
    "questionText": "What is 2 + 2?",
    "choices": [
      { "choiceText": "3", "isCorrect": false },
      { "choiceText": "4", "isCorrect": true },
      { "choiceText": "5", "isCorrect": false },
      { "choiceText": "6", "isCorrect": false }
    ]
  }
]
```

