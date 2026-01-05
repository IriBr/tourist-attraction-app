import { Resend } from 'resend';
import { config } from '../config/index.js';

const resend = config.email.resendApiKey ? new Resend(config.email.resendApiKey) : null;

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  if (!resend) {
    console.log(`[DEV] Verification email for ${email}: ${config.appUrl}/verify-email?token=${token}`);
    return;
  }

  const verificationUrl = `${config.appUrl}/verify-email?token=${token}`;

  await resend.emails.send({
    from: config.email.fromAddress,
    to: email,
    subject: 'Verify your Wandr account',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #0D9488;">🌍 Wandr</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #18181b;">Welcome, ${name}!</h2>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #52525b;">
                Thanks for signing up for Wandr! Please verify your email address to complete your registration and start exploring the world.
              </p>

              <!-- Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background-color: #0D9488; text-decoration: none; border-radius: 8px;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 20px; font-size: 14px; line-height: 1.6; color: #0D9488; word-break: break-all;">
                ${verificationUrl}
              </p>

              <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                This link will expire in 24 hours.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #a1a1aa; text-align: center;">
                If you didn't create an account with Wandr, you can safely ignore this email.
              </p>
              <p style="margin: 10px 0 0; font-size: 12px; line-height: 1.6; color: #a1a1aa; text-align: center;">
                © ${new Date().getFullYear()} Wandr. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  if (!resend) {
    console.log(`[DEV] Password reset email for ${email}: ${config.appUrl}/reset-password?token=${token}`);
    return;
  }

  const resetUrl = `${config.appUrl}/reset-password?token=${token}`;

  await resend.emails.send({
    from: config.email.fromAddress,
    to: email,
    subject: 'Reset your Wandr password',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #0D9488;">🌍 Wandr</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #18181b;">Reset your password</h2>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #52525b;">
                Hi ${name}, we received a request to reset your password. Click the button below to create a new password.
              </p>

              <!-- Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; background-color: #0D9488; text-decoration: none; border-radius: 8px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 20px; font-size: 14px; line-height: 1.6; color: #0D9488; word-break: break-all;">
                ${resetUrl}
              </p>

              <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                This link will expire in 1 hour.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #a1a1aa; text-align: center;">
                If you didn't request a password reset, you can safely ignore this email.
              </p>
              <p style="margin: 10px 0 0; font-size: 12px; line-height: 1.6; color: #a1a1aa; text-align: center;">
                © ${new Date().getFullYear()} Wandr. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  if (!resend) {
    console.log(`[DEV] Welcome email for ${email}`);
    return;
  }

  await resend.emails.send({
    from: config.email.fromAddress,
    to: email,
    subject: 'Welcome to Wandr! 🌍',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Wandr</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #0D9488;">🌍 Wandr</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #18181b;">Your email is verified!</h2>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #52525b;">
                Welcome to Wandr, ${name}! 🎉 Your account is now fully set up and you're ready to start exploring.
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #52525b;">
                Here's what you can do with Wandr:
              </p>

              <ul style="margin: 0 0 20px; padding-left: 20px; font-size: 16px; line-height: 1.8; color: #52525b;">
                <li>🗺️ Discover attractions around the world</li>
                <li>📸 Verify visits by taking photos</li>
                <li>🏆 Earn badges as you explore</li>
                <li>⭐ Save favorites and leave reviews</li>
              </ul>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #52525b;">
                Open the app and start your adventure today!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #a1a1aa; text-align: center;">
                © ${new Date().getFullYear()} Wandr. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
}
