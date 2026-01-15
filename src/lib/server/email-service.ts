import nodemailer from "nodemailer";

/**
 * Email Service
 * Sends OTP emails to users using SMTP (nodemailer).
 * Works in both development and production if SMTP is configured.
 */
export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL } =
    process.env;

  // Check if SMTP is configured
  if (
    !SMTP_HOST ||
    !SMTP_PORT ||
    !SMTP_USER ||
    !SMTP_PASS ||
    !SMTP_FROM_EMAIL
  ) {
    throw new Error(
      "SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL environment variables."
    );
  }

  // Block Gmail SMTP (not recommended for security reasons)
  if (SMTP_HOST === "smtp.gmail.com") {
    throw new Error(
      "Gmail SMTP is not recommended for security reasons. Please use a different email provider:\n" +
        "1. SendGrid (smtp.sendgrid.net) - Recommended\n" +
        "2. Mailgun (smtp.mailgun.org)\n" +
        "3. Zoho Mail (smtp.zoho.com)\n" +
        "4. Outlook (smtp-mail.outlook.com)\n" +
        "Update SMTP_HOST in .env.local file."
    );
  }

  // Create transporter (PRODUCTION only)
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465, // 465 -> SSL, 587 -> TLS
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });

  // Check if trying to use Gmail (not recommended for security reasons)
  if (SMTP_HOST === "smtp.gmail.com") {
    throw new Error(
      "Gmail SMTP is not recommended for security reasons. Please use a different email provider:\n" +
        "1. SendGrid (smtp.sendgrid.net) - Recommended\n" +
        "2. Mailgun (smtp.mailgun.org)\n" +
        "3. Zoho Mail (smtp.zoho.com)\n" +
        "4. Outlook (smtp-mail.outlook.com)\n" +
        "Update SMTP_HOST in .env.local file."
    );
  }

  // Verify connection first
  try {
    await transporter.verify();
    console.log("✅ SMTP connection verified successfully");
  } catch (verifyError: any) {
    let errorMessage =
      verifyError.message || "Unable to connect to SMTP server";

    // Provide helpful error messages
    if (
      errorMessage.includes("Invalid login") ||
      errorMessage.includes("BadCredentials")
    ) {
      errorMessage = `SMTP authentication failed. Please check:
1. SMTP_USER and SMTP_PASS are correct
2. For SendGrid: SMTP_USER should be "apikey" and SMTP_PASS should be your API key
3. For other providers: Use your email and password/app password
4. Make sure there are no extra spaces or quotes in .env.local`;
    }

    throw new Error(`SMTP connection failed: ${errorMessage}`);
  }

  // Send email (PRODUCTION only)
  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM_EMAIL,
      to: email,
      subject: "Your SAT-Ziyo OTP Code",
      text: `Your OTP code is: ${otp}. This code will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 10px;">
            <h2 style="color: #333; margin-top: 0;">Your Verification Code</h2>
            <p style="color: #666; font-size: 16px;">Your one-time password (OTP) is:</p>
            <div style="background-color: #f0f8ff; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
              <h1 style="color: #4CAF50; font-size: 36px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${otp}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">
              <strong>⏱️ This code will expire in 10 minutes.</strong>
            </p>
            <p style="color: #666; font-size: 14px;">
              <strong>🔒 This code can only be used once.</strong>
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #999; font-size: 12px; margin-bottom: 0;">
              If you didn't request this code, please ignore this email or contact support.
            </p>
          </div>
        </div>
      `,
    });
    console.log(`✅ Email sent successfully. Message ID: ${info.messageId}`);
  } catch (sendError: any) {
    throw new Error(
      `Failed to send email: ${
        sendError.message || "Unknown error occurred while sending email."
      }`
    );
  }
}
