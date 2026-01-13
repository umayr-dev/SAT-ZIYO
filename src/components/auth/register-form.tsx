"use client";

import { useState, useMemo } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
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

interface RegisterFormProps {
  onSubmit: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<void>;
  onGoogleSignIn?: () => void;
  isLoading?: boolean;
  error?: string | null;
  footerLink?: {
    text: string;
    href: string;
    linkText: string;
  };
}

export function RegisterForm({
  onSubmit,
  onGoogleSignIn,
  isLoading = false,
  error,
  footerLink,
}: RegisterFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password requirements validation
  const passwordRequirements = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
  }, [password]);

  // Calculate password strength (0-100)
  const passwordStrength = useMemo(() => {
    if (!password) return 0;

    let strength = 0;
    if (passwordRequirements.minLength) strength += 20;
    if (passwordRequirements.hasUpperCase) strength += 20;
    if (passwordRequirements.hasLowerCase) strength += 20;
    if (passwordRequirements.hasNumber) strength += 20;
    if (passwordRequirements.hasSpecialChar) strength += 20;

    return strength;
  }, [password, passwordRequirements]);

  // Get password strength color
  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return "bg-gray-200";
    if (passwordStrength <= 40) return "bg-red-500";
    if (passwordStrength <= 60) return "bg-yellow-500";
    if (passwordStrength <= 80) return "bg-sky-500";
    return "bg-green-500";
  };

  // Get password strength text
  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return "";
    if (passwordStrength <= 40) return "Weak";
    if (passwordStrength <= 60) return "Fair";
    if (passwordStrength <= 80) return "Good";
    return "Strong";
  };

  // Check if all password requirements are met
  const allRequirementsMet = useMemo(() => {
    return Object.values(passwordRequirements).every((req) => req === true);
  }, [passwordRequirements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    // Name validation
    if (!name) {
      newErrors.name = "Name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Email validation
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (!allRequirementsMet) {
      newErrors.password = "Password does not meet all requirements";
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      await onSubmit(name, email, password, confirmPassword);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Create Account
        </CardTitle>
        <CardDescription className="text-center">
          Enter your information to create a new account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && <ErrorMessage message={error} />}

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) {
                  setErrors({ ...errors, name: undefined });
                }
              }}
              className={errors.name ? "border-destructive" : ""}
              disabled={isLoading}
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors({ ...errors, email: undefined });
                }
              }}
              className={errors.email ? "border-destructive" : ""}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors({ ...errors, password: undefined });
                  }
                }}
                className={cn(
                  "pr-10",
                  errors.password ? "border-destructive" : ""
                )}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}

            {/* Password Requirements */}
            {password && (
              <div className="space-y-3 pt-2">
                {/* Password Strength Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Password Strength</span>
                    <span
                      className={cn(
                        "font-medium",
                        passwordStrength <= 40
                          ? "text-red-500"
                          : passwordStrength <= 60
                          ? "text-yellow-500"
                          : passwordStrength <= 80
                          ? "text-sky-500"
                          : "text-green-500"
                      )}
                    >
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-300",
                        getPasswordStrengthColor()
                      )}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                </div>

                {/* Password Requirements List */}
                <div className="space-y-1.5 text-xs">
                  <div
                    className={cn(
                      "flex items-center gap-2",
                      passwordRequirements.minLength
                        ? "text-green-600"
                        : "text-gray-500"
                    )}
                  >
                    {passwordRequirements.minLength ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                    <span>At least 8 characters</span>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-2",
                      passwordRequirements.hasUpperCase
                        ? "text-green-600"
                        : "text-gray-500"
                    )}
                  >
                    {passwordRequirements.hasUpperCase ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                    <span>One uppercase letter</span>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-2",
                      passwordRequirements.hasLowerCase
                        ? "text-green-600"
                        : "text-gray-500"
                    )}
                  >
                    {passwordRequirements.hasLowerCase ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                    <span>One lowercase letter</span>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-2",
                      passwordRequirements.hasNumber
                        ? "text-green-600"
                        : "text-gray-500"
                    )}
                  >
                    {passwordRequirements.hasNumber ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                    <span>One number</span>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-2",
                      passwordRequirements.hasSpecialChar
                        ? "text-green-600"
                        : "text-gray-500"
                    )}
                  >
                    {passwordRequirements.hasSpecialChar ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                    <span>One special character</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) {
                    setErrors({ ...errors, confirmPassword: undefined });
                  }
                }}
                className={cn(
                  "pr-10",
                  errors.confirmPassword ? "border-destructive" : ""
                )}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loading size="sm" />
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </Button>

          {onGoogleSignIn && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onGoogleSignIn}
                disabled={isLoading}
              >
                <svg
                  className="mr-2 h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign up with Google
              </Button>
            </>
          )}

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
