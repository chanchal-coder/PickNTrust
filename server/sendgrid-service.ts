import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, otp: string): Promise<boolean> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">PickNTrust Admin</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">Password Reset Request</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa; border-radius: 10px; margin-top: 20px;">
        <h2 style="color: #333; margin-bottom: 20px;">Password Reset Code</h2>
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          You requested a password reset for your PickNTrust admin account. Use the code below to reset your password:
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 4px;">
            ${otp}
          </div>
        </div>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
          This code will expire in 10 minutes for security reasons.
        </p>
        
        <p style="color: #999; font-size: 14px; margin-top: 30px;">
          If you didn't request this password reset, please ignore this email.
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p>© 2025 PickNTrust. All rights reserved.</p>
        <p>This is an automated email, please do not reply.</p>
      </div>
    </div>
  `;

  const textContent = `
    PickNTrust Admin - Password Reset Request
    
    You requested a password reset for your PickNTrust admin account.
    
    Your reset code is: ${otp}
    
    This code will expire in 10 minutes for security reasons.
    
    If you didn't request this password reset, please ignore this email.
    
    © 2025 PickNTrust. All rights reserved.
  `;

  return await sendEmail({
    to: email,
    from: 'noreply@pickntrust.com', // You can customize this
    subject: 'PickNTrust Admin - Password Reset Code',
    text: textContent,
    html: htmlContent
  });
}