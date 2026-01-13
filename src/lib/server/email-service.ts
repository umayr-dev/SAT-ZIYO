/**
 * Email Service
 * Sends OTP emails to users
 * In production, use a real email service (SendGrid, AWS SES, etc.)
 */

/**
 * Send OTP email
 * In development, logs to console
 * In production, integrate with real email service
 */
export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  // In development, log to console
  if (process.env.NODE_ENV === "development") {
    console.log(`\n📧 OTP Email to ${email}:`);
    console.log(`   Your OTP code is: ${otp}`);
    console.log(`   (This expires in 10 minutes)\n`);
    return;
  }

  // In production, use a real email service
  // Example with SendGrid:
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  await sgMail.send({
    to: email,
    from: 'noreply@yourdomain.com',
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}. This expires in 10 minutes.`,
    html: `<p>Your OTP code is: <strong>${otp}</strong></p><p>This expires in 10 minutes.</p>`,
  });
  */

  // For now, just log (replace with real service)
  console.log(`OTP sent to ${email}: ${otp}`);
}

