"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/src/ui/button";
import { Input } from "@/src/ui/input";
import { Label } from "@/src/ui/label";
import { Loading } from "@/src/ui/loading";
import { ErrorMessage } from "@/src/components/error-message";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/ui/card";
import { cn } from "@/lib/utils";

interface OtpFormProps {
  title: string;
  description: string;
  email: string;
  onSubmit: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  footerLink?: {
    text: string;
    href: string;
    linkText: string;
  };
}

export function OtpForm({
  title,
  description,
  email,
  onSubmit,
  onResend,
  isLoading = false,
  error,
  footerLink,
}: OtpFormProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    // Handle backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Handle paste
    if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, "").slice(0, 6).split("");
        const newCode = [...code];
        digits.forEach((digit, i) => {
          if (i < 6) {
            newCode[i] = digit;
          }
        });
        setCode(newCode);
        // Focus last filled input or last input
        const lastIndex = Math.min(digits.length - 1, 5);
        inputRefs.current[lastIndex]?.focus();
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = code.join("");
    if (otpCode.length === 6) {
      await onSubmit(otpCode);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      await onResend();
      setResendCooldown(60);
    } catch (error) {
      console.error("Resend failed:", error);
    } finally {
      setIsResending(false);
    }
  };

  const isCodeComplete = code.every((digit) => digit !== "");

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {title}
        </CardTitle>
        <CardDescription className="text-center">{description}</CardDescription>
        <CardDescription className="text-center text-sm text-muted-foreground">
          We sent a 6-digit code to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && <ErrorMessage message={error} />}

          <div className="space-y-2">
            <Label htmlFor="otp">Enter verification code</Label>
            <div className="flex gap-2 justify-center">
              {code.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={cn(
                    "w-12 h-14 text-center text-2xl font-bold",
                    error ? "border-destructive" : ""
                  )}
                  disabled={isLoading}
                  autoFocus={index === 0}
                />
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || isResending || isLoading}
              className={cn(
                "text-sm text-primary hover:underline",
                (resendCooldown > 0 || isResending || isLoading) &&
                  "text-muted-foreground cursor-not-allowed"
              )}
            >
              {isResending ? (
                <span className="flex items-center gap-2 justify-center">
                  <Loading size="sm" />
                  Sending...
                </span>
              ) : resendCooldown > 0 ? (
                `Resend code in ${resendCooldown}s`
              ) : (
                "Resend code"
              )}
            </button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full"
            disabled={!isCodeComplete || isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loading size="sm" />
                Verifying...
              </span>
            ) : (
              "Verify Code"
            )}
          </Button>

          {footerLink && (
            <p className="text-sm text-center text-muted-foreground">
              {footerLink.text}{" "}
              <a
                href={footerLink.href}
                className="text-primary hover:underline font-medium"
              >
                {footerLink.linkText}
              </a>
            </p>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
