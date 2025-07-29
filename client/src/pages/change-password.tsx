import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import Header from '@/components/header';
import { changePasswordSchema, type ChangePassword } from '@shared/schema';
import { Eye, EyeOff, Lock, Shield, CheckCircle } from 'lucide-react';

export default function ChangePasswordPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ChangePassword>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePassword) => {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Password Changed Successfully! 🎉',
        description: 'Your password has been updated. You can now use your new password to login.',
      });
      form.reset();
      
      // Redirect to admin panel after 2 seconds
      setTimeout(() => {
        setLocation('/admin');
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: 'Password Change Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ChangePassword) => {
    changePasswordMutation.mutate(data);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <div className="pt-20">
        <div className="max-w-md mx-auto px-4 py-8">
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Change Password
              </CardTitle>
              <CardDescription>
                Update your admin password for enhanced security
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Current Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      {...form.register('currentPassword')}
                      placeholder="Enter current password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.formState.errors.currentPassword && (
                    <p className="text-sm text-red-600">{form.formState.errors.currentPassword.message}</p>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
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
                    <Lock className="w-4 h-4" />
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
                  disabled={changePasswordMutation.isPending}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-200"
                >
                  {changePasswordMutation.isPending ? 'Changing Password...' : 'Change Password'}
                </Button>

                {/* Back to Admin */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation('/admin')}
                  className="w-full"
                >
                  Back to Admin Panel
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Security Tips */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">🔒 Security Tips</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <li>• Use a password manager to generate strong passwords</li>
              <li>• Never share your admin password with anyone</li>
              <li>• Change your password regularly for security</li>
              <li>• Avoid using personal information in passwords</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}