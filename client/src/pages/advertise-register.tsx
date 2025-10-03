import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  User, 
  CreditCard,
  CheckCircle,
  ArrowLeft,
  Shield,
  Clock,
  Target
} from 'lucide-react';

const AdvertiseRegisterPage = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selection, setSelection] = useState<null | {
    placementId: string;
    placementName: string;
    duration: string;
    currency: string;
  }>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    websiteUrl: '',
    businessType: '',
    monthlyBudget: '',
    currency: 'USD',
    campaignGoals: '',
    targetAudience: '',
    previousExperience: '',
    paymentMethod: '',
    billingAddress: '',
    agreeToTerms: false,
    agreeToPrivacy: false,
    subscribeNewsletter: false
  });

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Read pre-selected plan from query params
  useEffect(() => {
    try {
      const qs = new URLSearchParams(window.location.search);
      const placementId = qs.get('placementId');
      const placementName = qs.get('placementName');
      const duration = qs.get('duration');
      const currency = qs.get('currency');
      if (placementId && placementName && duration && currency) {
        setSelection({ placementId, placementName, duration, currency });
      }
    } catch {}
  }, []);

  const businessTypes = [
    'E-commerce',
    'SaaS/Technology',
    'Healthcare',
    'Education',
    'Finance',
    'Real Estate',
    'Travel & Tourism',
    'Food & Beverage',
    'Fashion & Beauty',
    'Automotive',
    'Other'
  ];

  const budgetRanges = {
    USD: [
      '$500 - $1,000',
      '$1,000 - $2,500',
      '$2,500 - $5,000',
      '$5,000 - $10,000',
      '$10,000 - $25,000',
      '$25,000+'
    ],
    EUR: [
      '€450 - €900',
      '€900 - €2,250',
      '€2,250 - €4,500',
      '€4,500 - €9,000',
      '€9,000 - €22,500',
      '€22,500+'
    ],
    GBP: [
      '£400 - £800',
      '£800 - £2,000',
      '£2,000 - £4,000',
      '£4,000 - £8,000',
      '£8,000 - £20,000',
      '£20,000+'
    ],
    INR: [
      '₹40,000 - ₹80,000',
      '₹80,000 - ₹2,00,000',
      '₹2,00,000 - ₹4,00,000',
      '₹4,00,000 - ₹8,00,000',
      '₹8,00,000 - ₹20,00,000',
      '₹20,00,000+'
    ]
  };

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' }
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agreeToTerms || !formData.agreeToPrivacy) {
      toast({
        title: "Agreement Required",
        description: "Please agree to the Terms of Service and Privacy Policy to continue.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/advertisers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          contactName: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          website: formData.websiteUrl,
          industry: formData.businessType,
          campaignType: 'banner',
          monthlyBudget: formData.monthlyBudget,
          currency: formData.currency,
          targetAudience: formData.targetAudience,
          businessAddress: formData.billingAddress,
          taxId: '',
          billingAddress: formData.billingAddress,
          paymentMethod: formData.paymentMethod,
          password: 'tempPassword123', // In real app, this would be a proper password field
          agreeToTerms: formData.agreeToTerms,
          agreeToPrivacy: formData.agreeToPrivacy
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Registration Successful!",
          description: "Your application has been submitted. We'll review it within 24 hours and send you login credentials.",
        });
        setLocation('/advertise/dashboard');
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "There was an error submitting your application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    {
      icon: <Target className="h-5 w-5" />,
      title: "Targeted Reach",
      description: "Connect with your ideal customers"
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: "Quick Approval",
      description: "Get started within 24 hours"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Brand Safety",
      description: "Premium, brand-safe environment"
    }
  ];

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-20 px-4 text-white">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Link href="/advertise">
              <Button variant="ghost" className="mb-6 text-white hover:text-white hover:bg-white/10 border border-white/30">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Advertising
              </Button>
            </Link>
            <div className="relative">
              <h1 className="relative text-5xl font-bold text-white mb-6 drop-shadow-lg">
                Start Advertising with PickNTrust
              </h1>
            </div>
            <p className="text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
              Join hundreds of successful brands and reach your ideal customers with our premium advertising platform.
            </p>
            {selection && (
              <div className="mt-6 flex justify-center">
                <div className="rounded-lg border border-white/30 bg-white/10 px-4 py-3 text-white shadow-sm backdrop-blur-sm">
                  <span className="font-semibold text-white">Selected Plan:</span>
                  <span className="ml-2 text-gray-200">{selection.placementName} — {selection.duration.toUpperCase()} ({selection.currency})</span>
                </div>
              </div>
            )}
          </div>

          {/* Onboarding Steps (Rich, professional accents) */}
          <div className="mb-10 grid sm:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-xl">
              <div className="p-2 rounded-md bg-blue-600/20 text-blue-300">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-300">Step 1</p>
                <p className="text-white font-semibold">Submit Registration</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-xl">
              <div className="p-2 rounded-md bg-purple-600/20 text-purple-300">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-300">Step 2</p>
                <p className="text-white font-semibold">24-hour Approval</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-xl">
              <div className="p-2 rounded-md bg-pink-600/20 text-pink-300">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-300">Step 3</p>
                <p className="text-white font-semibold">Launch Campaign</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Benefits Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8 bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <CheckCircle className="h-5 w-5 text-emerald-400 mr-2" />
                    Why Advertise With Us?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 rounded-lg bg-gray-900/40 border border-gray-700 hover:border-gray-600 transition-all duration-300">
                      <div className="text-blue-300 mt-1 p-2 rounded-lg bg-blue-600/10">{benefit.icon}</div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">{benefit.title}</h4>
                        <p className="text-sm text-gray-300">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t border-gray-700/30">
                    <div className="bg-gray-900/40 border border-gray-700 rounded-lg p-4">
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-none px-4 py-2 text-sm font-bold shadow-lg">
                        <Clock className="h-4 w-4 mr-2" />
                        24-Hour Approval Process
                      </Badge>
                      <p className="text-gray-300 text-sm mt-2">
                        Get approved quickly and start advertising within 24 hours.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Registration Form */}
            <div className="lg:col-span-2">
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-2xl">
                <CardHeader className="pb-8">
                  <CardTitle className="text-2xl text-white flex items-center">
                    <Building2 className="h-6 w-6 mr-3 text-blue-400" />
                    Advertiser Registration
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-lg">
                    Please provide your business information to get started with our premium advertising platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Company Information */}
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold flex items-center text-white border-b border-gray-700 pb-3">
                        <Building2 className="h-6 w-6 mr-3 text-blue-400" />
                        Company Information
                      </h3>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="companyName" className="text-gray-200 font-medium">Company Name *</Label>
                          <Input
                            id="companyName"
                            value={formData.companyName}
                            onChange={(e) => handleInputChange('companyName', e.target.value)}
                            placeholder="Your Company Ltd."
                            className="mt-2 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-300"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="businessType" className="text-gray-200 font-medium">Business Type *</Label>
                          <Select onValueChange={(value) => handleInputChange('businessType', value)}>
                            <SelectTrigger className="mt-2 bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-300">
                              <SelectValue placeholder="Select business type" className="text-gray-400" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-700">
                              {businessTypes.map((type) => (
                                <SelectItem key={type} value={type} className="text-white hover:bg-gray-800">{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="websiteUrl" className="text-gray-200 font-medium">Website URL</Label>
                        <div className="relative mt-2">
                          <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="websiteUrl"
                            value={formData.websiteUrl}
                            onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                            placeholder="https://yourwebsite.com"
                            className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-300"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold flex items-center text-white border-b border-gray-700 pb-3">
                        <User className="h-6 w-6 mr-3 text-emerald-400" />
                        Contact Information
                      </h3>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="contactPerson" className="text-gray-200 font-medium">Contact Person *</Label>
                          <Input
                            id="contactPerson"
                            value={formData.contactPerson}
                            onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                            placeholder="John Doe"
                            className="mt-2 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-300"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone" className="text-gray-200 font-medium">Phone Number</Label>
                          <div className="relative mt-2">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="phone"
                              value={formData.phone}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              placeholder="+1 (555) 123-4567"
                              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-300"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="email" className="text-gray-200 font-medium">Email Address *</Label>
                        <div className="relative mt-2">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="john@company.com"
                            className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-300"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Campaign Information */}
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold flex items-center text-white border-b border-gray-700 pb-3">
                        <Target className="h-6 w-6 mr-3 text-purple-400" />
                        Campaign Information
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="currency" className="text-gray-200 font-medium">Currency *</Label>
                          <Select onValueChange={(value) => {
                            handleInputChange('currency', value);
                            // Reset budget when currency changes
                            handleInputChange('monthlyBudget', '');
                          }}>
                            <SelectTrigger className="mt-2 bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-300">
                              <SelectValue placeholder="Select currency" className="text-gray-400" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-700">
                              {currencies.map((currency) => (
                                <SelectItem key={currency.code} value={currency.code} className="text-white hover:bg-gray-800">
                                  {currency.symbol} {currency.name} ({currency.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="monthlyBudget" className="text-gray-200 font-medium">Monthly Budget *</Label>
                          <Select onValueChange={(value) => handleInputChange('monthlyBudget', value)}>
                              <SelectTrigger className="mt-2 bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-300">
                              <SelectValue placeholder="Select your monthly budget" className="text-gray-400" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-700">
                              {budgetRanges[formData.currency as keyof typeof budgetRanges]?.map((range) => (
                                <SelectItem key={range} value={range} className="text-white hover:bg-gray-800">{range}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="campaignGoals" className="text-gray-200 font-medium">Campaign Goals</Label>
                        <Textarea
                          id="campaignGoals"
                          value={formData.campaignGoals}
                          onChange={(e) => handleInputChange('campaignGoals', e.target.value)}
                          placeholder="What do you want to achieve with your advertising campaign?"
                          rows={3}
                          className="mt-2 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-300 resize-none"
                        />
                      </div>

                      <div>
                        <Label htmlFor="targetAudience" className="text-gray-200 font-medium">Target Audience</Label>
                        <Textarea
                          id="targetAudience"
                          value={formData.targetAudience}
                          onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                          placeholder="Describe your ideal customer demographics and interests"
                          rows={3}
                          className="mt-2 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-300 resize-none"
                        />
                      </div>
                    </div>

                    {/* Payment Information */}
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold flex items-center text-white border-b border-gray-700 pb-3">
                        <CreditCard className="h-6 w-6 mr-3 text-yellow-400" />
                        Billing Information
                      </h3>
                      
                      <div>
                        <Label htmlFor="billingAddress" className="text-gray-200 font-medium">Billing Address</Label>
                        <Textarea
                          id="billingAddress"
                          value={formData.billingAddress}
                          onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                          placeholder="Your complete billing address"
                          rows={3}
                          className="mt-2 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-300 resize-none"
                        />
                      </div>
                    </div>

                    {/* Agreements */}
                    <div className="space-y-4 pt-6 border-t border-gray-700">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="agreeToTerms"
                          checked={formData.agreeToTerms}
                          onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked as boolean)}
                          className="border-gray-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 mt-1"
                        />
                        <Label htmlFor="agreeToTerms" className="text-sm leading-6 text-gray-300">
                          I agree to the <Link href="/terms-of-service" className="text-blue-400 hover:text-blue-300 underline">Terms of Service</Link> and advertising policies *
                        </Label>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="agreeToPrivacy"
                          checked={formData.agreeToPrivacy}
                          onCheckedChange={(checked) => handleInputChange('agreeToPrivacy', checked as boolean)}
                          className="border-gray-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 mt-1"
                        />
                        <Label htmlFor="agreeToPrivacy" className="text-sm leading-6 text-gray-300">
                          I agree to the <Link href="/privacy-policy" className="text-blue-400 hover:text-blue-300 underline">Privacy Policy</Link> *
                        </Label>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="subscribeNewsletter"
                          checked={formData.subscribeNewsletter}
                          onCheckedChange={(checked) => handleInputChange('subscribeNewsletter', checked as boolean)}
                          className="border-gray-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 mt-1"
                        />
                        <Label htmlFor="subscribeNewsletter" className="text-sm leading-6 text-gray-300">
                          Subscribe to our newsletter for advertising tips and updates
                        </Label>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 text-lg shadow-xl hover:shadow-2xl transform hover:scale-[1.01] transition-all duration-300"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Submitting Application...
                        </div>
                      ) : (
                        'Submit Application'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default AdvertiseRegisterPage;