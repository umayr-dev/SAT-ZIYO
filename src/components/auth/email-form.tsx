"use client";

import { useState } from "react";
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

interface EmailFormProps {
  title: string;
  description: string;
  submitLabel: string;
  onSubmit: (email: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  footerLink?: {
    text: string;
    href: string;
    linkText: string;
  };
}

export function EmailForm({
  title,
  description,
  submitLabel,
  onSubmit,
  isLoading = false,
  error,
  footerLink,
}: EmailFormProps) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    if (!email) {
      setEmailError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    await onSubmit(email);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {title}
        </CardTitle>
        <CardDescription className="text-center">{description}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && <ErrorMessage message={error} />}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) {
                  setEmailError(null);
                }
              }}
              className={emailError ? "border-destructive" : ""}
              disabled={isLoading}
              autoFocus
            />
            {emailError && (
              <p className="text-sm text-destructive">{emailError}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loading size="sm" />
                Sending code...
              </span>
            ) : (
              submitLabel
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
