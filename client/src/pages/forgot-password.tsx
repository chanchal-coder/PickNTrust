import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail, Phone, Key, Clock } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [step, setStep] = useState<'request' | 'verify' | 'reset'>('request');
  const [method] = useState<'email'>('email');
  const [timeLeft, setTimeLeft] = useState(0);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Request password reset
  const requestResetMutation = useMutation({
    mutationFn: async (data: { method: 'email'; contact: string }) => {
      const response = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send reset code');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setResetToken(data.token);
      setStep('verify');
      setTimeLeft(300); // 5 minutes
      
      // Start countdown timer
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      toast({
        title: 'Reset Code Sent!',
        description: `Check your email at ${email} for the reset code.`
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Send Reset Code',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Verify OTP
  const verifyOtpMutation = useMutation({
    mutationFn: async (data: { token: string; otp: string }) => {
      const response = await fetch('/api/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Invalid OTP');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setStep('reset');
      toast({
        title: 'OTP Verified!',
        description: 'Now you can set your new password.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Invalid OTP',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Reset password
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; otp: string; newPassword: string }) => {
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reset password');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Password Reset Successful!',
        description: 'You can now login with your new password.'
      });
      setTimeout(() => {
        setLocation('/admin');
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: 'Password Reset Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleRequestReset = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address.',
        variant: 'destructive'
      });
      return;
    }
    
    requestResetMutation.mutate({
      method: 'email',
      contact: email
    });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp) {
      toast({
        title: 'OTP Required',
        description: 'Please enter the verification code.',
        variant: 'destructive'
      });
      return;
    }
    
    verifyOtpMutation.mutate({
      token: resetToken,
      otp
    });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast({
        title: 'Password Required',
        description: 'Please enter and confirm your new password.',
        variant: 'destructive'
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords Don\'t Match',
        description: 'Please make sure both passwords are identical.',
        variant: 'destructive'
      });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive'
      });
      return;
    }
    
    resetPasswordMutation.mutate({
      token: resetToken,
      otp,
      newPassword
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Link 
                href="/admin" 
                className="absolute left-4 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <CardTitle className="text-2xl text-navy dark:text-blue-400">
                Reset Admin Password
              </CardTitle>
            </div>
            <CardDescription>
              {step === 'request' && 'Enter your admin email to receive a reset code'}
              {step === 'verify' && 'Enter the verification code sent to your email'}
              {step === 'reset' && 'Create your new password'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {step === 'request' && (
              <form onSubmit={handleRequestReset} className="space-y-6">
                <div>
                  <Label htmlFor="email">Admin Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sharmachanchalcvp@gmail.com"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the admin email address associated with your account
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-bright-blue hover:bg-navy"
                  disabled={requestResetMutation.isPending}
                >
                  {requestResetMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Reset Code
                    </>
                  )}
                </Button>
              </form>
            )}

            {step === 'verify' && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-300">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Code expires in {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    className="text-center text-2xl tracking-widest"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Check your email inbox for the verification code
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full bg-bright-blue hover:bg-navy"
                    disabled={verifyOtpMutation.isPending || otp.length !== 6}
                  >
                    {verifyOtpMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        Verify Code
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      if (timeLeft === 0) {
                        requestResetMutation.mutate({
                          method: 'email',
                          contact: email
                        });
                      }
                    }}
                    disabled={timeLeft > 0 || requestResetMutation.isPending}
                  >
                    {timeLeft > 0 ? 'Resend Available After Timeout' : 'Resend Code'}
                  </Button>
                </div>
              </form>
            )}

            {step === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✓ Identity verified. You can now set a new password.
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least 8 characters long
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={8}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 mr-2" />
                      Reset Password
                    </>
                  )}
                </Button>
              </form>
            )}
            
            <div className="mt-6 text-center">
              <Link 
                href="/admin" 
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
              >
                ← Back to Admin Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}