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

interface AuthFormProps {
  title: string;
  description: string;
  submitLabel: string;
  onSubmit: (email: string, password: string) => Promise<void>;
  onGoogleSignIn?: () => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  showConfirmPassword?: boolean;
  footerLink?: {
    text: string;
    href: string;
    linkText: string;
  };
}

export function AuthForm({
  title,
  description,
  submitLabel,
  onSubmit,
  onGoogleSignIn,
  isLoading = false,
  error,
  showConfirmPassword = false,
  footerLink,
}: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPasswordField, setShowConfirmPasswordField] =
    useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password requirements validation (only for register)
  const passwordRequirements = useMemo(() => {
    if (!showConfirmPassword) return null;

    return {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
  }, [password, showConfirmPassword]);

  // Calculate password strength (0-100)
  const passwordStrength = useMemo(() => {
    if (!showConfirmPassword || !password) return 0;

    const requirements = passwordRequirements;
    if (!requirements) return 0;

    let strength = 0;
    if (requirements.minLength) strength += 20;
    if (requirements.hasUpperCase) strength += 20;
    if (requirements.hasLowerCase) strength += 20;
    if (requirements.hasNumber) strength += 20;
    if (requirements.hasSpecialChar) strength += 20;

    return strength;
  }, [password, passwordRequirements, showConfirmPassword]);

  // Get password strength color
  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return "bg-gray-200";
    if (passwordStrength <= 40) return "bg-red-500";
    if (passwordStrength <= 60) return "bg-yellow-500";
    if (passwordStrength <= 80) return "bg-blue-500";
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
    if (!passwordRequirements) return false;
    return Object.values(passwordRequirements).every((req) => req === true);
  }, [passwordRequirements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    // Email validation
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (showConfirmPassword) {
      // Stricter validation for registration
      if (password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      } else if (!allRequirementsMet) {
        newErrors.password = "Password does not meet all requirements";
      }
    } else {
      // Basic validation for login
      if (password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
    }

    // Confirm password validation
    if (showConfirmPassword) {
      if (!confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      await onSubmit(email, password);
    }
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
                placeholder={
                  showConfirmPassword
                    ? "Create a password"
                    : "Enter your password"
                }
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

            {/* Password Requirements (only for register) */}
            {showConfirmPassword && password && (
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
                          ? "text-blue-500"
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
                      passwordRequirements?.minLength
                        ? "text-green-600"
                        : "text-gray-500"
                    )}
                  >
                    {passwordRequirements?.minLength ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                    <span>At least 8 characters</span>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-2",
                      passwordRequirements?.hasUpperCase
                        ? "text-green-600"
                        : "text-gray-500"
                    )}
                  >
                    {passwordRequirements?.hasUpperCase ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                    <span>One uppercase letter</span>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-2",
                      passwordRequirements?.hasLowerCase
                        ? "text-green-600"
                        : "text-gray-500"
                    )}
                  >
                    {passwordRequirements?.hasLowerCase ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                    <span>One lowercase letter</span>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-2",
                      passwordRequirements?.hasNumber
                        ? "text-green-600"
                        : "text-gray-500"
                    )}
                  >
                    {passwordRequirements?.hasNumber ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                    <span>One number</span>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-2",
                      passwordRequirements?.hasSpecialChar
                        ? "text-green-600"
                        : "text-gray-500"
                    )}
                  >
                    {passwordRequirements?.hasSpecialChar ? (
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

          {showConfirmPassword && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPasswordField ? "text" : "password"}
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
                  onClick={() =>
                    setShowConfirmPasswordField(!showConfirmPasswordField)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPasswordField ? (
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
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loading size="sm" />
                Processing...
              </span>
            ) : (
              submitLabel
            )}
          </Button>

          {onGoogleSignIn && (
            <>
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
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
                  aria-hidden="true"
                  focusable="false"
                  data-prefix="fab"
                  data-icon="google"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 488 512"
                >
                  <path
                    fill="currentColor"
                    d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 52.6 94.3 256s164.2 203.4 254.8 203.4c56.5 0 103.9-20.1 141.2-54.6 24.1-20.1 44.3-47.6 47.7-81.4H248v-94.6h240z"
                  ></path>
                </svg>
                Continue with Google
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
