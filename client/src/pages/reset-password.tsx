import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/header';
import { resetPasswordSchema, type ResetPassword } from '@shared/schema';
import { Eye, EyeOff, Shield, CheckCircle, AlertCircle, KeyRound } from 'lucide-react';

interface ResetPasswordPageProps {
  params: { token: string };
}

export default function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [resetComplete, setResetComplete] = useState(false);

  const form = useForm<ResetPassword>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: params.token,
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch('/api/admin/verify-reset-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: params.token }),
        });

        if (response.ok) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          const error = await response.json();
          toast({
            title: 'Invalid Reset Link',
            description: error.message || 'This reset link is invalid or has expired.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        setTokenValid(false);
        toast({
          title: 'Verification Failed',
          description: 'Unable to verify reset link. Please try again.',
          variant: 'destructive',
        });
      }
    };

    verifyToken();
  }, [params.token, toast]);

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPassword) => {
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reset password');
      }

      return response.json();
    },
    onSuccess: () => {
      setResetComplete(true);
      toast({
        title: 'Password Reset Successful! 🎉',
        description: 'Your password has been updated. You can now login with your new password.',
      });
      
      // Redirect to admin login after 3 seconds
      setTimeout(() => {
        setLocation('/admin');
      }, 3000);
    },
    onError: (error: Error) => {
      toast({
        title: 'Password Reset Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ResetPassword) => {
    resetPasswordMutation.mutate(data);
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    
    return { strength, label: labels[strength - 1] || 'Very Weak', color: colors[strength - 1] || 'bg-red-500' };
  };

  const newPassword = form.watch('newPassword');
  const passwordStrength = getPasswordStrength(newPassword);

  // Loading state while verifying token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Header />
        <div className="pt-20">
          <div className="max-w-md mx-auto px-4 py-8">
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Verifying reset link...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
        <Header />
        <div className="pt-20">
          <div className="max-w-md mx-auto px-4 py-8">
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  Invalid Reset Link
                </CardTitle>
                <CardDescription>
                  This password reset link is invalid or has expired
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Reset links expire after 24 hours for security reasons. 
                    You'll need to request a new password reset.
                  </p>
                </div>

                <Button asChild className="w-full">
                  <Link href="/admin/forgot-password">
                    Request New Reset Link
                  </Link>
                </Button>

                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin">
                    Back to Login
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (resetComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
        <Header />
        <div className="pt-20">
          <div className="max-w-md mx-auto px-4 py-8">
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  Password Reset Complete!
                </CardTitle>
                <CardDescription>
                  Your admin password has been successfully updated
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-300 text-center">
                    You can now login to the admin panel with your new password. 
                    Redirecting you to the login page...
                  </p>
                </div>

                <Button asChild className="w-full">
                  <Link href="/admin">
                    Go to Login
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Main reset password form
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <div className="pt-20">
        <div className="max-w-md mx-auto px-4 py-8">
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                <KeyRound className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Create New Password
              </CardTitle>
              <CardDescription>
                Enter your new admin password below
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Hidden token field */}
                <input type="hidden" {...form.register('token')} />

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      {...form.register('newPassword')}
                      placeholder="Enter new password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {passwordStrength.label}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        <p className="flex items-center gap-1">
                          {newPassword.length >= 8 ? <CheckCircle className="w-3 h-3 text-green-500" /> : <span className="w-3 h-3 rounded-full bg-gray-300" />}
                          At least 8 characters
                        </p>
                        <p className="flex items-center gap-1">
                          {/[A-Z]/.test(newPassword) ? <CheckCircle className="w-3 h-3 text-green-500" /> : <span className="w-3 h-3 rounded-full bg-gray-300" />}
                          One uppercase letter
                        </p>
                        <p className="flex items-center gap-1">
                          {/[a-z]/.test(newPassword) ? <CheckCircle className="w-3 h-3 text-green-500" /> : <span className="w-3 h-3 rounded-full bg-gray-300" />}
                          One lowercase letter
                        </p>
                        <p className="flex items-center gap-1">
                          {/[0-9]/.test(newPassword) ? <CheckCircle className="w-3 h-3 text-green-500" /> : <span className="w-3 h-3 rounded-full bg-gray-300" />}
                          One number
                        </p>
                        <p className="flex items-center gap-1">
                          {/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? <CheckCircle className="w-3 h-3 text-green-500" /> : <span className="w-3 h-3 rounded-full bg-gray-300" />}
                          One special character
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {form.formState.errors.newPassword && (
                    <p className="text-sm text-red-600">{form.formState.errors.newPassword.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...form.register('confirmPassword')}
                      placeholder="Confirm new password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-600">{form.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={resetPasswordMutation.isPending || passwordStrength.strength < 3}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  {resetPasswordMutation.isPending ? 'Resetting Password...' : 'Reset Password'}
                </Button>

                {passwordStrength.strength < 3 && newPassword && (
                  <p className="text-sm text-amber-600 text-center">
                    Please create a stronger password before continuing
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">🔐 Security Notice</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <li>• Your new password will replace the old one immediately</li>
              <li>• Make sure to save your password in a secure location</li>
              <li>• This reset link will expire after use for security</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}