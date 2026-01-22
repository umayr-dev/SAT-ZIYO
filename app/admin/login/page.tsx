import { redirect } from "next/navigation";

/**
 * Admin login page - redirects to main login page
 * Admin authentication uses the same login flow as regular users
 * (email/password + OTP or Google OAuth)
 */
export default function AdminLoginPage() {
  // Redirect to main login page with redirect back to /admin
  redirect("/auth/login?redirect=/admin");
}


