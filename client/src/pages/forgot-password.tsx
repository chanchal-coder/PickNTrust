import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/header';
import { forgotPasswordSchema, type ForgotPassword } from '@shared/schema';
import { Mail, Phone, KeyRound, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [resetSent, setResetSent] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'email' | 'phone'>('email');

  const form = useForm<ForgotPassword>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      resetMethod: 'email',
      email: '',
      phone: '',
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPassword) => {
      const response = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send reset request');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setResetSent(true);
      toast({
        title: 'Reset Request Sent Successfully! ✅',
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Reset Request Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ForgotPassword) => {
    forgotPasswordMutation.mutate(data);
  };

  // Watch for changes in reset method
  const watchedMethod = form.watch('resetMethod');
  
  if (resetSent) {
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
                  Reset Link Sent!
                </CardTitle>
                <CardDescription>
                  Check your {selectedMethod === 'email' ? 'email inbox' : 'phone messages'} for further instructions
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="text-center space-y-4">
                  {selectedMethod === 'email' ? (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Mail className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        We've sent a password reset link to your email address. 
                        The link will expire in 24 hours.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Phone className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-green-700 dark:text-green-300">
                        We've sent a 6-digit reset code to your phone number. 
                        The code will expire in 15 minutes.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">What's next?</h4>
                  <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Check your {selectedMethod === 'email' ? 'email inbox (and spam folder)' : 'phone messages'}</li>
                    <li>{selectedMethod === 'email' ? 'Click the reset link' : 'Enter the 6-digit code'}</li>
                    <li>Create your new password</li>
                    <li>Login with your new credentials</li>
                  </ol>
                </div>

                <Button asChild className="w-full" variant="outline">
                  <Link href="/admin">
                    <ArrowLeft className="w-4 h-4 mr-2" />
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <div className="pt-20">
        <div className="max-w-md mx-auto px-4 py-8">
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                <KeyRound className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Reset Password
              </CardTitle>
              <CardDescription>
                Choose how you'd like to reset your admin password
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Reset Method Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Choose Reset Method</Label>
                  <RadioGroup
                    value={watchedMethod}
                    onValueChange={(value) => {
                      form.setValue('resetMethod', value as 'email' | 'phone');
                      setSelectedMethod(value as 'email' | 'phone');
                      // Clear the other field when switching methods
                      if (value === 'email') {
                        form.setValue('phone', '');
                      } else {
                        form.setValue('email', '');
                      }
                    }}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <RadioGroupItem value="email" id="email-method" />
                      <Label htmlFor="email-method" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Mail className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium">Email Reset</p>
                          <p className="text-sm text-gray-500">Get a reset link via email</p>
                        </div>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <RadioGroupItem value="phone" id="phone-method" />
                      <Label htmlFor="phone-method" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Phone className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium">SMS Reset</p>
                          <p className="text-sm text-gray-500">Get a code via SMS</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Email Input (shown when email method selected) */}
                {watchedMethod === 'email' && (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Admin Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register('email')}
                      placeholder="sharmachanchalcvp@gmail.com"
                      className="bg-white dark:bg-gray-700"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                )}

                {/* Phone Input (shown when phone method selected) */}
                {watchedMethod === 'phone' && (
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Admin Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...form.register('phone')}
                      placeholder="9898892198"
                      className="bg-white dark:bg-gray-700"
                    />
                    {form.formState.errors.phone && (
                      <p className="text-sm text-red-600">{form.formState.errors.phone.message}</p>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={forgotPasswordMutation.isPending}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-3 rounded-lg transition-all duration-200"
                >
                  {forgotPasswordMutation.isPending 
                    ? 'Sending Reset Request...' 
                    : `Send Reset ${watchedMethod === 'email' ? 'Link' : 'Code'}`
                  }
                </Button>

                {/* Back to Login */}
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </Link>
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">Need Help?</h4>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              If you don't receive the reset {watchedMethod === 'email' ? 'email' : 'SMS'} within a few minutes, 
              please check your {watchedMethod === 'email' ? 'spam folder or' : ''} contact the system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}