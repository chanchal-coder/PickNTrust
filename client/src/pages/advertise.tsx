import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Target, 
  TrendingUp, 
  Users, 
  Eye, 
  MousePointer, 
  BarChart3, 
  Zap, 
  Shield, 
  CheckCircle,
  ArrowRight,
  Star,
  Globe,
  Smartphone,
  Monitor,
  
} from 'lucide-react';

const AdvertisePage = () => {
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const features = [
    {
      icon: <Target className="h-6 w-6 text-blue-400" />,
      title: "Targeted Advertising",
      description: "Reach your ideal customers with precision targeting based on demographics, interests, and behavior."
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-green-400" />,
      title: "High Conversion Rates",
      description: "Our engaged audience delivers exceptional conversion rates, maximizing your advertising ROI."
    },
    {
      icon: <Users className="h-6 w-6 text-purple-400" />,
      title: "Quality Audience",
      description: "Connect with active shoppers and decision-makers who are ready to purchase."
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-orange-400" />,
      title: "Real-time Analytics",
      description: "Track your campaign performance with detailed analytics and insights in real-time."
    },
    {
      icon: <Zap className="h-6 w-6 text-yellow-400" />,
      title: "Quick Setup",
      description: "Get your campaigns live within 24 hours with our streamlined approval process."
    },
    {
      icon: <Shield className="h-6 w-6 text-red-400" />,
      title: "Brand Safety",
      description: "Your ads appear in a premium, brand-safe environment alongside quality content."
    }
  ];

  // Currency conversion rates (base: INR)
  const currencyRates = {
    INR: 1,
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0095
  };

  const currencies = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' }
  ];

  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'razorpay' | 'manual'>('stripe');

  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const convertPrice = (inrPrice: number) => {
    const rate = currencyRates[selectedCurrency as keyof typeof currencyRates];
    const converted = Math.round(inrPrice * rate);
    return converted;
  };

  const formatPrice = (inrPrice: number) => {
    const currency = currencies.find(c => c.code === selectedCurrency);
    const convertedPrice = convertPrice(inrPrice);
    return `${currency?.symbol}${convertedPrice.toLocaleString()}`;
  };

  const startCheckout = async (placement: { id: string; name: string; pricing: any }, duration: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    try {
      if (paymentMethod === 'razorpay') {
        // Razorpay works best with INR; use base INR pricing
        const amountInINR = placement.pricing[duration];

        const orderResp = await fetch('/api/payments/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            placementId: placement.id,
            placementName: placement.name,
            duration,
            amount: amountInINR,
            currency: 'INR',
          }),
        });

        const orderData = await orderResp.json();
        if (!orderResp.ok) {
          throw new Error(orderData?.error || 'Failed to create Razorpay order');
        }

        const loaded = await loadRazorpayScript();
        if (!loaded) {
          throw new Error('Failed to load Razorpay SDK');
        }

        const options: any = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'PickNTrust Ads',
          description: `${placement.name} (${duration})`,
          order_id: orderData.orderId,
          theme: { color: '#6b46c1' },
          handler: function (response: any) {
            toast({ title: 'Payment success', description: 'Payment captured. Thank you!' });
            if (orderData.successRedirect) {
              window.location.href = orderData.successRedirect;
            }
          },
          modal: {
            ondismiss: function () {
              if (orderData.cancelRedirect) {
                window.location.href = orderData.cancelRedirect;
              }
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        return;
      }

      // Stripe or manual
      const currency = selectedCurrency.toLowerCase();
      const amountNumber = convertPrice(placement.pricing[duration]);

      const resp = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placementId: placement.id,
          placementName: placement.name,
          duration,
          amount: amountNumber,
          currency,
          preferredMethod: paymentMethod === 'manual' ? 'manual' : undefined,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || 'Checkout failed');
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast({ title: 'Payment initiated', description: data?.message || 'Our team will contact you to complete the process.' });
      }
    } catch (err: any) {
      toast({ title: 'Checkout error', description: err.message || 'Something went wrong', variant: 'destructive' });
    }
  };

  // Auth-gated handler: if logged in, proceed to checkout; else navigate to register with selection preserved
  const handlePickNow = (placement: { id: string; name: string; pricing: any }, duration: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    const params = new URLSearchParams({
      placementId: placement.id,
      placementName: placement.name,
      duration,
      currency: selectedCurrency,
    });
    // Always route to checkout for a consistent professional flow
    setLocation(`/advertise/checkout?${params.toString()}`);
  };

  const adPlacements = [
    {
      id: 'sidebar-banner',
      name: 'Sidebar Banner',
      dimensions: '300×250',
      description: 'Perfect for consistent brand visibility',
      pricing: {
        daily: 99,
        weekly: 299,
        monthly: 999,
        yearly: 9999
      }
    },
    {
      id: 'sponsored-post',
      name: 'Sponsored Deals Post',
      dimensions: 'Deals Section',
      description: 'Promoted listing on pages',
      pricing: {
        daily: 99,
        weekly: 499,
        monthly: 1499,
        yearly: 14999
      },
      details: {
        daily: 'Pinned 24h',
        weekly: '1 Post / Week',
        monthly: '4 Posts',
        yearly: '50 Posts'
      }
    },
    {
      id: 'hero-banner',
      name: 'Homepage Hero Banner',
      dimensions: '728×90 or 728×250',
      description: 'Maximum visibility and impact',
      pricing: {
        daily: 249,
        weekly: 799,
        monthly: 2999,
        yearly: 29999
      },
      popular: true
    },
    {
      id: 'combo',
      name: 'Combo Package',
      dimensions: 'Website + Telegram',
      description: 'Multi-platform advertising solution',
      pricing: {
        daily: 199,
        weekly: 799,
        monthly: 2499,
        yearly: 24999
      }
    },
    {
      id: 'blog-post',
      name: 'Sponsored Blog Post',
      dimensions: 'Blog/Deals Section',
      description: 'Native content promotion to boost visibility and engagement',
      pricing: {
        daily: 199,
        weekly: 699,
        monthly: 2499,
        yearly: 19999
      },
      details: {
        daily: 'Pinned 24h',
        weekly: '1 Post / Week',
        monthly: '4 Posts',
        yearly: '12 Posts'
      }
    },
    {
      id: 'video-post',
      name: 'Sponsored Video Post',
      dimensions: 'Video + Social Channels',
      description: 'Amplify your reach with video across site and socials',
      pricing: {
        daily: 299,
        weekly: 999,
        monthly: 3499,
        yearly: 29999
      }
    },
    {
      id: 'content-combo',
      name: 'Content Combo (Blog + Video)',
      dimensions: 'Blog + Video',
      description: 'Bundled promotion across blog and video channels',
      pricing: {
        daily: 449,
        weekly: 1499,
        monthly: 4999,
        yearly: 39999
      }
    },
    {
      id: 'category-banner',
      name: 'Category Top Banner',
      dimensions: 'Specific Pages',
      description: 'Target specific audience segments',
      pricing: {
        daily: 149,
        weekly: 499,
        monthly: 1999,
        yearly: 19999
      }
    }
  ];

  const stats = [
    { label: 'Monthly Visitors', value: '2.5M+', icon: <Users className="h-5 w-5" /> },
    { label: 'Page Views', value: '8.7M+', icon: <Eye className="h-5 w-5" /> },
    { label: 'Avg. Session Duration', value: '4:32', icon: <Monitor className="h-5 w-5" /> },
    { label: 'Mobile Traffic', value: '68%', icon: <Smartphone className="h-5 w-5" /> }
  ];

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        {/* Hero Section */}
        <section className="relative py-20 px-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20"></div>
          <div className="relative max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg">
              Advertise with <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">PickNTrust</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-3xl mx-auto drop-shadow-md">
              Reach millions of engaged shoppers and boost your brand visibility with our premium advertising platform. 
              Join thousands of successful brands already growing with us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-semibold rounded-md shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                onClick={() => setLocation('/advertise/register')}
              >
                Start Advertising Today
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="px-8 py-4 border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm rounded-md font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              >
                View Pricing Plans
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="px-8 py-4 border-2 border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10 backdrop-blur-sm rounded-md font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                onClick={() => setLocation('/advertise/dashboard')}
              >
                Dashboard
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 px-4 bg-gradient-to-r from-gray-900 to-black">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <Card key={index} className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-2 text-blue-400">
                      {stat.icon}
                    </div>
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-300">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Ad Placements Overview Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
                Premium Ad Placements
              </h2>
              <p className="text-xl text-gray-200 max-w-2xl mx-auto drop-shadow-md">
                Choose from high-performing ad placements that deliver results
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adPlacements.map((placement, index) => (
                <Card key={index} className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border-gray-700/50 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-white">{placement.name}</CardTitle>
                    <Badge variant="secondary" className="w-fit bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-400">
                      {placement.dimensions}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-gray-300 text-sm">{placement.description}</p>
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-600">
                      <span className="text-gray-400">Starting from:</span>
                      <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">{formatPrice(placement.pricing.daily)}/day</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 px-4 bg-gradient-to-br from-gray-900 via-slate-900 to-black">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
                Ad Placement Pricing
              </h2>
              <p className="text-xl text-gray-200 max-w-2xl mx-auto mb-8 drop-shadow-md">
                Flexible duration-based pricing for all your advertising needs
              </p>
              
              {/* Currency Selector */}
              <div className="flex justify-center mb-8">
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-lg p-1 inline-flex shadow-xl">
                  {currencies.map((currency) => (
                    <button
                      key={currency.code}
                      onClick={() => setSelectedCurrency(currency.code)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                        selectedCurrency === currency.code
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                          : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                      }`}
                    >
                      {currency.symbol} {currency.code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method Selector removed from Advertise page; selection happens on Checkout */}
            </div>

            {/* Pricing Grid */}
            <div className="space-y-8">
              {adPlacements.map((placement) => (
                <Card 
                  key={placement.id} 
                  className={`relative transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl ${
                    placement.popular 
                      ? 'bg-gradient-to-br from-blue-900 to-purple-900 border-2 border-yellow-400 shadow-yellow-400/20' 
                      : 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700'
                  }`}
                >
                  {placement.popular && (
                    <Badge className="absolute -top-3 left-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold shadow-lg">
                      Most Popular
                    </Badge>
                  )}
                  
                  <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle className="text-2xl text-white mb-2 drop-shadow-lg">{placement.name}</CardTitle>
                        <Badge variant="secondary" className="w-fit bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none mb-2 shadow-lg">
                          {placement.dimensions}
                        </Badge>
                        <CardDescription className="text-gray-200 drop-shadow-md">{placement.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Daily */}
                      <div className="bg-gradient-to-br from-blue-700 to-indigo-800 rounded-lg p-4 text-center border border-blue-500 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                        <div className="text-sm text-blue-200 mb-1 font-bold">Daily</div>
                        <div className="text-2xl font-bold text-white mb-1 drop-shadow-lg">
                          {formatPrice(placement.pricing.daily)}
                        </div>
                        <div className="text-xs text-blue-200">per day</div>
                        {placement.details?.daily && (
                          <div className="text-xs text-blue-200 mt-1">{placement.details.daily}</div>
                        )}
                        <div className="mt-3">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handlePickNow(placement, 'daily')}>Pick Now</Button>
                        </div>
                      </div>
                      
                      {/* Weekly */}
                      <div className="bg-gradient-to-br from-purple-700 to-fuchsia-800 rounded-lg p-4 text-center border border-purple-500 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                        <div className="text-sm text-purple-200 mb-1 font-bold">Weekly</div>
                        <div className="text-2xl font-bold text-white mb-1 drop-shadow-lg">
                          {formatPrice(placement.pricing.weekly)}
                        </div>
                        <div className="text-xs text-purple-200">per week</div>
                        {placement.details?.weekly && (
                          <div className="text-xs text-purple-200 mt-1">{placement.details.weekly}</div>
                        )}
                        <div className="mt-3">
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => handlePickNow(placement, 'weekly')}>Pick Now</Button>
                        </div>
                      </div>
                      
                      {/* Monthly */}
                      <div className="bg-gradient-to-br from-amber-700 to-orange-800 rounded-lg p-4 text-center border border-amber-500 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                        <div className="text-sm text-amber-200 mb-1 font-bold">Monthly</div>
                        <div className="text-2xl font-bold text-white mb-1 drop-shadow-lg">
                          {formatPrice(placement.pricing.monthly)}
                        </div>
                        <div className="text-xs text-amber-200">per month</div>
                        {placement.details?.monthly && (
                          <div className="text-xs text-amber-200 mt-1">{placement.details.monthly}</div>
                        )}
                        <div className="mt-3">
                          <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => handlePickNow(placement, 'monthly')}>Pick Now</Button>
                        </div>
                      </div>
                      
                      {/* Yearly */}
                      <div className="bg-gradient-to-br from-green-700 to-emerald-800 rounded-lg p-4 text-center border border-green-500 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                        <div className="text-sm text-green-200 mb-1 font-bold">Yearly</div>
                        <div className="text-2xl font-bold text-white mb-1 drop-shadow-lg">
                          {formatPrice(placement.pricing.yearly)}
                        </div>
                        <div className="text-xs text-green-200">per year</div>
                        {placement.details?.yearly && (
                          <div className="text-xs text-green-200 mt-1">{placement.details.yearly}</div>
                        )}
                        <Badge className="mt-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-none text-xs font-bold shadow-lg">
                          Best Value
                        </Badge>
                        <div className="mt-3">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handlePickNow(placement, 'yearly')}>Pick Now</Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-center">
                      <Link href="/advertise/register">
                        <Button 
                          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-md shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                        >
                          Pick {placement.name}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Enterprise Custom Pricing Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-slate-900 via-gray-900 to-black">
          <div className="max-w-4xl mx-auto">
            <Card className="relative bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-2xl">
              <Badge className="absolute -top-3 left-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg">
                Enterprise
              </Badge>
              
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-3xl text-white mb-4 drop-shadow-lg">Custom Enterprise Solutions</CardTitle>
                <CardDescription className="text-gray-200 text-lg max-w-2xl mx-auto drop-shadow-md">
                  Need something more? We create tailored advertising packages for large-scale campaigns, 
                  multi-platform integrations, and enterprise-level requirements.
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-4">
                    <h4 className="text-xl font-semibold text-white mb-3">Enterprise Features</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center text-gray-300">
                        <CheckCircle className="h-5 w-5 mr-3 text-green-400 flex-shrink-0" />
                        Unlimited ad placements across all channels
                      </li>
                      <li className="flex items-center text-gray-300">
                        <CheckCircle className="h-5 w-5 mr-3 text-green-400 flex-shrink-0" />
                        Dedicated account manager & priority support
                      </li>
                      <li className="flex items-center text-gray-300">
                        <CheckCircle className="h-5 w-5 mr-3 text-green-400 flex-shrink-0" />
                        Custom ad formats & creative development
                      </li>
                      <li className="flex items-center text-gray-300">
                        <CheckCircle className="h-5 w-5 mr-3 text-green-400 flex-shrink-0" />
                        Advanced analytics & reporting dashboard
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xl font-semibold text-white mb-3">Perfect For</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center text-gray-300">
                        <ArrowRight className="h-4 w-4 mr-3 text-blue-400 flex-shrink-0" />
                        Large corporations & brands
                      </li>
                      <li className="flex items-center text-gray-300">
                        <ArrowRight className="h-4 w-4 mr-3 text-blue-400 flex-shrink-0" />
                        Multi-market campaigns
                      </li>
                      <li className="flex items-center text-gray-300">
                        <ArrowRight className="h-4 w-4 mr-3 text-blue-400 flex-shrink-0" />
                        Long-term partnerships
                      </li>
                      <li className="flex items-center text-gray-300">
                        <ArrowRight className="h-4 w-4 mr-3 text-blue-400 flex-shrink-0" />
                        Custom integration requirements
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="mb-6">
                    <div className="text-4xl font-bold text-white mb-2 drop-shadow-lg">Custom Pricing</div>
                    <div className="text-gray-200">Tailored to your specific needs</div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="mailto:ads@pickntrust.com?subject=Advertising%20Support">
                      <Button 
                        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-md shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                      >
                        Contact Sales Team
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </a>
                    <a href="tel:+919898892198">
                      <Button 
                        variant="outline" 
                        className="px-8 py-3 border-2 border-gray-600 text-gray-200 hover:bg-gray-700/50 rounded-md font-semibold transition-colors duration-200"
                      >
                        Schedule Call
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features Section - Why Choose PickNTrust */}
        <section className="py-20 px-4 bg-gradient-to-br from-gray-900 via-slate-900 to-black">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
                Why Choose PickNTrust?
              </h2>
              <p className="text-xl text-gray-200 max-w-2xl mx-auto drop-shadow-md">
                Join hundreds of successful brands that trust us to deliver results
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                  <CardHeader>
                    <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mb-2 w-fit shadow-lg">{feature.icon}</div>
                    <CardTitle className="text-xl text-white">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-300 leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-slate-800 via-slate-900 to-black">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
                Contact Us
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto drop-shadow-md">
                Ready to start advertising? Get in touch with our team for personalized support
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Phone */}
              <Card className="bg-gradient-to-br from-blue-800/20 to-blue-900/20 border-blue-600/30 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <i className="fas fa-phone text-white text-xl"></i>
                  </div>
                  <CardTitle className="text-white text-xl">Call Us</CardTitle>
                  <CardDescription className="text-blue-200">
                    Speak directly with our advertising specialists
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <a href="tel:+919898892198" className="inline-block">
                    <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                      <i className="fas fa-phone mr-2"></i>
                      +91 9898892198
                    </Button>
                  </a>
                </CardContent>
              </Card>

              {/* WhatsApp */}
              <Card className="bg-gradient-to-br from-green-800/20 to-green-900/20 border-green-600/30 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <i className="fab fa-whatsapp text-white text-xl"></i>
                  </div>
                  <CardTitle className="text-white text-xl">WhatsApp</CardTitle>
                  <CardDescription className="text-green-200">
                    Quick support and instant responses
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <a href="https://wa.me/919898892198" target="_blank" rel="noopener noreferrer" className="inline-block">
                    <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                      <i className="fab fa-whatsapp mr-2"></i>
                      Message Us
                    </Button>
                  </a>
                </CardContent>
              </Card>

              {/* Email */}
              <Card className="bg-gradient-to-br from-purple-800/20 to-purple-900/20 border-purple-600/30 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                    <i className="fas fa-envelope text-white text-xl"></i>
                  </div>
                  <CardTitle className="text-white text-xl">Email</CardTitle>
                  <CardDescription className="text-purple-200">
                    Detailed inquiries and support
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <a href="mailto:ads@pickntrust.com?subject=Advertising%20Inquiry" className="inline-block">
                    <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                      <i className="fas fa-envelope mr-2"></i>
                      ads@pickntrust.com
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-4 drop-shadow-lg">
              Ready to Grow Your Business?
            </h2>
            <p className="text-xl mb-8 text-gray-200 drop-shadow-md">
              Join thousands of successful advertisers who trust PickNTrust to deliver results. 
              Start your campaign today and see the difference quality advertising makes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/advertise/register">
                <Button size="lg" className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                  Start Advertising Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/advertise/dashboard">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="px-8 py-3 border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm rounded-md font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  Access Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default AdvertisePage;