import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// Email service for password resets
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Using Gmail SMTP for password reset emails
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'noreply.pickntrust@gmail.com', // You can create this email
        pass: process.env.EMAIL_PASSWORD || 'app-specific-password' // App password
      }
    });
  }

  // Old method - keep for backwards compatibility but not used
  async sendPasswordResetEmailWithLink(email: string, resetToken: string, siteDomain: string): Promise<boolean> {
    try {
      const resetUrl = `https://${siteDomain}/admin/reset-password/${resetToken}`;
      
      const mailOptions = {
        from: 'PickNTrust Admin <noreply.pickntrust@gmail.com>',
        to: email,
        subject: 'Reset Your Admin Password - PickNTrust',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #007bff; margin: 0;">🛡️ PickNTrust</h1>
              <p style="color: #666; margin: 5px 0;">Your trusted shopping companion</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 4px solid #007bff;">
              <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
              <p style="color: #666; line-height: 1.6;">
                We received a request to reset your admin password for PickNTrust. 
                Click the button below to create a new password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: linear-gradient(45deg, #007bff, #6610f2); 
                          color: white; padding: 15px 30px; text-decoration: none; 
                          border-radius: 8px; font-weight: bold; display: inline-block;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                Or copy and paste this link in your browser:<br>
                <a href="${resetUrl}" style="color: #007bff; word-break: break-all;">${resetUrl}</a>
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  🔒 This link will expire in 24 hours for security reasons.<br>
                  📧 If you didn't request this reset, please ignore this email.<br>
                  ⚠️ Never share this link with anyone.
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
              <p>© 2025 PickNTrust. All rights reserved.</p>
            </div>
          </div>
        `
      };

      // In development, just log the email instead of sending
      console.log(`
        📧 EMAIL NOTIFICATION
        ==================
        To: ${email}
        Subject: Reset Your PickNTrust Admin Password
        
        Hi Admin,
        
        You requested to reset your password. Use this verification code:
        
        Code: ${resetToken.slice(0, 6)} 
        
        This code will expire in 15 minutes.
        
        If you didn't request this, please ignore this email.
        
        Best regards,
        PickNTrust Team
        ==================
      `);
      
      return true; // Simulate successful email sending
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  // Updated method signature for OTP-based reset
  async sendPasswordResetEmail(email: string, otp: string): Promise<boolean> {
    try {
      console.log(`
        📧 EMAIL NOTIFICATION
        ==================
        To: ${email}
        Subject: Reset Your PickNTrust Admin Password
        
        Hi Admin,
        
        You requested to reset your password. Use this verification code:
        
        Code: ${otp}
        
        This code will expire in 15 minutes.
        
        If you didn't request this, please ignore this email.
        
        Best regards,
        PickNTrust Team
        ==================
      `);
      
      return true; // Simulate successful email sending
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }
}

// SMS service for phone-based password resets
export class SMSService {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';
  }

  async sendPasswordResetSMS(phone: string, resetCode: string): Promise<boolean> {
    try {
      // For demo purposes, we'll log the SMS instead of sending
      // In production, uncomment the Twilio integration below
      
      console.log(`📱 SMS to ${phone}: Your PickNTrust admin password reset code is: ${resetCode}. Valid for 15 minutes.`);
      
      /*
      const twilio = require('twilio');
      const client = twilio(this.accountSid, this.authToken);
      
      await client.messages.create({
        body: `Your PickNTrust admin password reset code is: ${resetCode}. Valid for 15 minutes. Never share this code.`,
        from: this.fromNumber,
        to: phone
      });
      */
      
      return true;
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }
}

// Token generation utilities
export class TokenService {
  static generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
  }

  static getTokenExpiry(): Date {
    return new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
  }
}

// Password validation utilities
export class PasswordService {
  static validatePasswordStrength(password: string): { valid: boolean; message: string } {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character' };
    }
    
    return { valid: true, message: 'Password is strong' };
  }

  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}