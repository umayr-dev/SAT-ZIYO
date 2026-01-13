/**
 * OTP Store
 * Temporary in-memory storage for OTPs
 * In production, use Redis or database with TTL
 */

interface OTPEntry {
  otp: string;
  email: string;
  expiresAt: Date;
}

// In-memory store (replace with Redis/database in production)
const otpStore = new Map<string, OTPEntry>();

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  const now = new Date();
  otpStore.forEach((entry, email) => {
    if (entry.expiresAt < now) {
      otpStore.delete(email);
    }
  });
}, 5 * 60 * 1000);

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store OTP with 10-minute expiration
 */
export async function storeOTP(email: string, otp: string): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  otpStore.set(email, {
    otp,
    email,
    expiresAt,
  });
}

/**
 * Verify OTP
 */
export async function verifyOTP(email: string, otp: string): Promise<boolean> {
  const entry = otpStore.get(email);

  if (!entry) {
    return false;
  }

  // Check expiration
  if (entry.expiresAt < new Date()) {
    otpStore.delete(email);
    return false;
  }

  // Verify OTP
  if (entry.otp !== otp) {
    return false;
  }

  return true;
}

/**
 * Clear OTP after successful verification
 */
export async function clearOTP(email: string): Promise<void> {
  otpStore.delete(email);
}
