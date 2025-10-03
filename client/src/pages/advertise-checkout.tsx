import React, { useEffect, useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useLocation } from 'wouter';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Lock, CreditCard, Wallet, Banknote, AlertCircle, ShieldCheck, Megaphone, Info, AlertTriangle, Copy } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

// Use same-origin base so dev/prod work on any port
const API_BASE = '';

type Duration = 'daily' | 'weekly' | 'monthly' | 'yearly';

const currencyRates = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
};

const currencies = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

export default function AdvertiseCheckoutPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const placementId = searchParams.get('placementId') || '';
  const placementName = searchParams.get('placementName') || '';
  const duration = (searchParams.get('duration') as Duration) || 'monthly';
  const initialCurrency = searchParams.get('currency') || 'INR';

  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'razorpay' | 'manual'>(initialCurrency === 'INR' ? 'razorpay' : 'stripe');
  const [selectedCurrency, setSelectedCurrency] = useState(initialCurrency);
  const [amountINR, setAmountINR] = useState<number | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  // Bank transfer inline fields
  const [bankPayerName, setBankPayerName] = useState('');
  const [bankScreenshot, setBankScreenshot] = useState<File | null>(null);
  const [transferCompleted, setTransferCompleted] = useState(false);
  const [utrRef, setUtrRef] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [manualSubmitted, setManualSubmitted] = useState(false);
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  // Admin-configured payment settings fetched from backend
  const [paymentSettings, setPaymentSettings] = useState<{
    upi_merchant_vpa?: string;
    upi_qr_url?: string;
    bank_account_holder?: string;
    bank_name_branch?: string;
    bank_account_number?: string;
    bank_ifsc?: string;
    instructions?: string;
  } | null>(null);
  const [bankReference, setBankReference] = useState('');
  const [bankNote, setBankNote] = useState('');
  // Contact & Billing
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('India');
  const [taxId, setTaxId] = useState(''); // GST/VAT
  // Stripe inline element state
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripePublishableKey, setStripePublishableKey] = useState<string | null>(null);
  const stripePromise = useMemo(() => (
    stripePublishableKey ? loadStripe(stripePublishableKey) : null
  ), [stripePublishableKey]);

  // No post-payment proof modal; bank transfer fields are inline

  // Merchant UPI settings from backend, fallback to env: VITE_MERCHANT_UPI_ID
  const merchantUpiId = (paymentSettings?.upi_merchant_vpa?.trim() || (import.meta as any).env?.VITE_MERCHANT_UPI_ID || '').trim();
  const upiDeepLink = useMemo(() => {
    if (!merchantUpiId || !amountINR) return '';
    const note = `${placementName} (${duration})`;
    return `upi://pay?pa=${merchantUpiId}&pn=PickNTrust&am=${amountINR}&cu=INR&tn=${encodeURIComponent(note)}`;
  }, [merchantUpiId, amountINR, placementName, duration]);

  // Fetch admin payment settings (UPI and bank details)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/payments/settings`);
        if (!resp.ok) throw new Error('Failed to fetch payment settings');
        const data = await resp.json();
        setPaymentSettings(data || null);
      } catch (e) {
        // Graceful failure: keep env fallback and show placeholders
        console.warn('Payment settings fetch failed:', e);
      }
    };
    fetchSettings();
  }, []);

  // Pull pricing baseline for display (mirrors advertise page defaults)
  useEffect(() => {
    // Baseline INR pricing for known placements
    const pricingMap: Record<string, Record<Duration, number>> = {
      'sidebar-banner': { daily: 99, weekly: 299, monthly: 999, yearly: 9999 },
      'sponsored-post': { daily: 99, weekly: 499, monthly: 1499, yearly: 14999 },
      'hero-banner': { daily: 249, weekly: 799, monthly: 2999, yearly: 29999 },
      'combo': { daily: 199, weekly: 799, monthly: 2499, yearly: 24999 },
      'blog-post': { daily: 199, weekly: 699, monthly: 2499, yearly: 19999 },
      'video-post': { daily: 299, weekly: 999, monthly: 3499, yearly: 29999 },
      'content-combo': { daily: 449, weekly: 1499, monthly: 4999, yearly: 39999 },
      'category-banner': { daily: 149, weekly: 499, monthly: 1999, yearly: 19999 },
    };
    const baseline = pricingMap[placementId]?.[duration];
    setAmountINR(baseline ?? null);
  }, [placementId, duration]);

  // Simple auth check: advertiser token or admin session present
  useEffect(() => {
    const token = localStorage.getItem('advertiserToken');
    const adminAuth = localStorage.getItem('pickntrust-admin-session');
    const loggedIn = Boolean(token) || adminAuth === 'active';
    setIsLoggedIn(loggedIn);
    if (!loggedIn) setShowAuthModal(true);
  }, []);

  // Pre-fill bank payer name from billing info
  useEffect(() => {
    setBankPayerName(prev => prev || name);
  }, [name]);

  // Adjust default payment method when currency changes
  useEffect(() => {
    if (selectedCurrency === 'INR' && paymentMethod === 'stripe') {
      setPaymentMethod('razorpay');
    } else if (selectedCurrency !== 'INR' && paymentMethod === 'razorpay') {
      setPaymentMethod('stripe');
    }
  }, [selectedCurrency]);

  const convertPrice = (inrPrice: number) => {
    const rate = currencyRates[selectedCurrency as keyof typeof currencyRates] || 1;
    return Math.round(inrPrice * rate);
  };

  const formatPrice = (inrPrice: number) => {
    const currency = currencies.find(c => c.code === selectedCurrency) || currencies[0];
    const convertedPrice = convertPrice(inrPrice);
    return `${currency.symbol}${convertedPrice.toLocaleString()}`;
  };

  // Currency compatibility rules
  const stripeBlocked = selectedCurrency === 'INR';
  const razorpayBlocked = selectedCurrency !== 'INR';
  const missingContact = !email || !name;
  const payDisabled = !acceptTerms || missingContact || !amountINR || (!isLoggedIn) ||
    (paymentMethod === 'stripe' && stripeBlocked) || (paymentMethod === 'razorpay' && razorpayBlocked);

  // Dynamic CTA text based on method and currency
  const ctaText = (() => {
    if (!amountINR) return 'Place Order & Pay';
    const price = formatPrice(amountINR);
    if (paymentMethod === 'razorpay') return `Pay ${price} Securely`;
    if (paymentMethod === 'stripe') return `Pay ${price} Securely`;
    return 'Submit for Verification';
  })();

  // Next payment date for recurring durations (weekly/monthly/yearly)
  const nextPaymentDate = (() => {
    const now = new Date();
    const d = new Date(now);
    if (duration === 'weekly') d.setDate(d.getDate() + 7);
    else if (duration === 'monthly') d.setMonth(d.getMonth() + 1);
    else if (duration === 'yearly') d.setFullYear(d.getFullYear() + 1);
    else return null;
    return d.toLocaleDateString();
  })();

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

  const startCheckout = async () => {
    if (!placementId || !placementName || !amountINR) {
      toast({ title: 'Missing selection', description: 'Please reselect your ad placement.', variant: 'destructive' });
      setLocation('/advertise');
      return;
    }

    if (!acceptTerms) {
      toast({ title: 'Please accept terms', description: 'You must accept the Terms of Service to continue.', variant: 'destructive' });
      return;
    }

    if (!email || !name) {
      toast({ title: 'Contact details required', description: 'Please enter your name and email.', variant: 'destructive' });
      return;
    }

    if (!isLoggedIn) {
      toast({ title: 'Login required', description: 'Please login or register to proceed to payment.' });
      setShowAuthModal(true);
      return;
    }

    try {
      if (paymentMethod === 'razorpay') {
        const orderResp = await fetch(`${API_BASE}/api/payments/razorpay/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            placementId,
            placementName,
            duration,
            amount: amountINR,
            currency: 'INR',
          }),
        });
        const orderData = await orderResp.json();
        if (!orderResp.ok) throw new Error(orderData?.error || 'Failed to create Razorpay order');

        const loaded = await loadRazorpayScript();
        if (!loaded) throw new Error('Failed to load Razorpay SDK');

        const options: any = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'PickNTrust Ads',
          description: `${placementName} (${duration})`,
          order_id: orderData.orderId,
          theme: { color: '#6b46c1' },
          prefill: {
            name,
            email,
            contact: phone || undefined,
          },
          handler: async function (response: any) {
            try {
              // Verify on server using signature
              const verifyResp = await fetch(`${API_BASE}/api/payments/razorpay/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                })
              });
              const verifyData = await verifyResp.json();
              if (!verifyResp.ok) throw new Error(verifyData?.error || 'Verification failed');
              toast({ title: 'Payment success', description: 'Payment captured and verified. Thank you!' });
              if (orderData.successRedirect) {
                window.location.href = orderData.successRedirect;
              }
            } catch (e: any) {
              toast({ title: 'Verify error', description: e.message || 'Unable to verify payment', variant: 'destructive' });
              setGatewayError('Payment failed or abandoned. Try another method below.');
            }
          },
          modal: {
            ondismiss: function () {
              if (orderData.cancelRedirect) window.location.href = orderData.cancelRedirect;
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        return;
      }

      // Stripe or manual
      const currency = selectedCurrency.toLowerCase();
      const amountNumber = convertPrice(amountINR);
      if (paymentMethod === 'stripe') {
        if (stripeBlocked) {
          throw new Error('Stripe is not available for INR payments');
        }
        // Initialize PaymentIntent and show inline Payment Element
      const resp = await fetch(`${API_BASE}/api/payments/stripe/create-payment-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            placementId,
            placementName,
            duration,
            amount: amountNumber,
            currency,
            customerEmail: email,
          }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data?.error || 'Failed to initialize card payment');
        setStripeClientSecret(data.clientSecret || null);
        setStripePublishableKey(data.publishableKey || null);
        toast({ title: 'Card Payment Ready', description: 'Enter card details below and confirm.' });
        return;
      }

      // Manual payment (bank transfer)
      if (!transferCompleted) {
        toast({ title: 'Confirm transfer', description: 'Please check “I have completed the transfer.”', variant: 'destructive' });
        return;
      }
      if (!utrRef || !utrRef.trim()) {
        toast({ title: 'UTR required', description: 'Please enter your UTR / Transaction ID.', variant: 'destructive' });
        return;
      }
      const resp = await fetch(`${API_BASE}/api/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placementId,
          placementName,
          duration,
          amount: amountNumber,
          currency,
          preferredMethod: 'manual',
          customer: { name, company, email, phone, country, taxId },
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || 'Checkout failed');
      // Submit proof with UTR and optional details
      const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      let screenshotBase64: string | undefined;
      if (bankScreenshot) {
        try {
          screenshotBase64 = await toBase64(bankScreenshot);
        } catch {}
      }
      const notes = [manualNote ? manualNote : null].filter(Boolean).join(' | ');
      const proofResp = await fetch(`${API_BASE}/api/payments/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: data?.paymentId,
          proofRef: utrRef,
          screenshotBase64,
          payerName: bankPayerName || undefined,
          notes: notes || undefined,
        }),
      });
      const proofData = await proofResp.json();
      if (!proofResp.ok) throw new Error(proofData?.error || 'Failed to submit verification details');
      setManualSubmitted(true);
      toast({ title: 'Details received', description: 'We’ll verify within 12–24 hrs and email confirmation.' });
    } catch (err: any) {
      toast({ title: 'Checkout error', description: err.message || 'Something went wrong', variant: 'destructive' });
      setGatewayError('Submission failed. You can retry or choose another method.');
    }
  };

  const onBack = () => setLocation('/advertise');

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-green-400" />
              <h1 className="text-2xl font-semibold">Secure Checkout</h1>
            </div>
            <Button variant="outline" onClick={onBack} className="border-gray-700 text-gray-200">Back</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column: Contact & Billing + Payment Methods */}
            <div className="md:col-span-2 space-y-6">
              <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-700 shadow-xl hover:shadow-2xl backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">1</span>
                    Contact & Billing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1">Full Name</label>
                      <input className="w-full bg-gray-800 text-white rounded border border-gray-700 px-3 py-2" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Company (optional)</label>
                      <input className="w-full bg-gray-800 text-white rounded border border-gray-700 px-3 py-2" value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Inc." />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Email</label>
                      <input className="w-full bg-gray-800 text-white rounded border border-gray-700 px-3 py-2" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Phone (optional)
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="ml-1 inline-flex align-middle text-gray-400 cursor-help"><Info className="h-3 w-3" /></span>
                            </TooltipTrigger>
                            <TooltipContent>Helps us reach you for payment support.</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </label>
                      <input className="w-full bg-gray-800 text-white rounded border border-gray-700 px-3 py-2" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 90000 00000" />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Country</label>
                      <input className="w-full bg-gray-800 text-white rounded border border-gray-700 px-3 py-2" value={country} onChange={e => setCountry(e.target.value)} placeholder="India" />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">GST/VAT (optional)
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="ml-1 inline-flex align-middle text-gray-400 cursor-help"><Info className="h-3 w-3" /></span>
                            </TooltipTrigger>
                            <TooltipContent>For tax invoices. Leave blank if not applicable.</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </label>
                      <input className="w-full bg-gray-800 text-white rounded border border-gray-700 px-3 py-2" value={taxId} onChange={e => setTaxId(e.target.value)} placeholder="GSTIN / VAT ID" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-700 shadow-xl hover:shadow-2xl backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">2</span>
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-gray-200">
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 rounded border border-gray-700 cursor-pointer">
                      <input type="radio" name="paymentMethod" checked={paymentMethod === 'stripe'} onChange={() => setPaymentMethod('stripe')} />
                      <CreditCard className="h-5 w-5 text-blue-400" />
                      <span className="font-medium">Cards (Stripe)</span>
                    </label>
                    <div className={`${paymentMethod === 'stripe' ? 'block' : 'hidden'} pl-8 space-y-2`}>
                      <div className="text-sm text-gray-300">You’ll choose Card, UPI, Netbanking, or Wallet on the next secure screen.</div>
                      {stripeBlocked && (
                        <div className="flex items-start gap-2 text-sm bg-blue-900/40 border border-blue-700 text-blue-200 p-3 rounded">
                          <AlertCircle className="h-4 w-4 mt-0.5" />
                          <div>
                            For INR payments, please use Razorpay. To use Stripe, choose USD/EUR/GBP.
                          </div>
                        </div>
                      )}
                    <div className="flex flex-wrap items-center gap-2 mt-2 opacity-90">
                      <span className="inline-flex items-center rounded-md bg-white/10 border border-white/20 px-2 py-1 text-xs text-white backdrop-blur">Visa</span>
                      <span className="inline-flex items-center rounded-md bg-white/10 border border-white/20 px-2 py-1 text-xs text-white backdrop-blur">
                        <span className="inline-flex items-center justify-center mr-1"><span className="inline-block w-2 h-2 rounded-full bg-red-600"></span><span className="inline-block w-2 h-2 rounded-full bg-yellow-500 -ml-1 opacity-80"></span></span>
                        Mastercard
                      </span>
                      <span className="inline-flex items-center rounded-md bg-white/10 border border-white/20 px-2 py-1 text-xs text-white backdrop-blur">American Express</span>
                      <span className="inline-flex items-center rounded-md bg-white/10 border border-white/20 px-2 py-1 text-xs text-white backdrop-blur">Discover</span>
                    </div>
                    {/* Inline Stripe form hidden per spec; gateway handles payment on secure screen */}
                  </div>

                    <label className="flex items-center gap-3 p-3 rounded border border-gray-700 cursor-pointer">
                      <input type="radio" name="paymentMethod" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} />
                      <Wallet className="h-5 w-5 text-green-400" />
                      <span className="font-medium">Razorpay (Cards • UPI • Netbanking • Wallets)</span>
                    </label>
                    <div className={`${paymentMethod === 'razorpay' ? 'block' : 'hidden'} pl-8 space-y-2`}>
                      <div className="text-sm text-gray-300">You’ll choose Card, UPI, Netbanking, or Wallet on the next secure screen.</div>
                      {razorpayBlocked && (
                        <div className="flex items-start gap-2 text-sm bg-amber-900/40 border border-amber-700 text-amber-200 p-3 rounded">
                          <AlertCircle className="h-4 w-4 mt-0.5" />
                          <div>
                            Razorpay supports INR only. Switch currency to INR to continue or choose Stripe for non-INR.
                          </div>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2 opacity-90">
                        <span className="inline-flex items-center rounded-md bg-white/10 border border-white/20 px-2 py-1 text-xs text-white backdrop-blur">Visa</span>
                        <span className="inline-flex items-center rounded-md bg-white/10 border border-white/20 px-2 py-1 text-xs text-white backdrop-blur">
                          <span className="inline-flex items-center justify-center mr-1"><span className="inline-block w-2 h-2 rounded-full bg-red-600"></span><span className="inline-block w-2 h-2 rounded-full bg-yellow-500 -ml-1 opacity-80"></span></span>
                          Mastercard
                        </span>
                        <span className="inline-flex items-center rounded-md bg-white/10 border border-white/20 px-2 py-1 text-xs text-white backdrop-blur">RuPay</span>
                        <span className="inline-flex items-center rounded-md bg-white/10 border border-white/20 px-2 py-1 text-xs text-white backdrop-blur">UPI</span>
                        <span className="inline-flex items-center rounded-md bg-white/10 border border-white/20 px-2 py-1 text-xs text-white backdrop-blur">Google Pay</span>
                        <span className="inline-flex items-center rounded-md bg-white/10 border border-white/20 px-2 py-1 text-xs text-white backdrop-blur">PhonePe</span>
                        <span className="inline-flex items-center rounded-md bg-white/10 border border-white/20 px-2 py-1 text-xs text-white backdrop-blur">Paytm</span>
                      </div>
                      {/* Removed UPI-specific inputs/QR per spec; Razorpay handles these on its secure screen */}
                    </div>

                    <label className="flex items-center gap-3 p-3 rounded border border-gray-700 cursor-pointer">
                      <input type="radio" name="paymentMethod" checked={paymentMethod === 'manual'} onChange={() => setPaymentMethod('manual')} />
                      <Banknote className="h-5 w-5 text-yellow-400" />
                      <span className="font-medium">Bank Transfer</span>
                    </label>
                    <div className={`${paymentMethod === 'manual' ? 'block' : 'hidden'} text-sm text-gray-300 pl-8 space-y-2`}>
                      <div>Pay via your banking/UPI app, then share your UTR/Transaction ID below so we can verify.</div>
                      <div className="mt-2 p-3 rounded border border-yellow-700 bg-yellow-900/20 text-gray-200">
                        <div className="text-xs text-gray-300 mb-2">Our bank details (tap to copy)</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs text-gray-400">Account Holder</div>
                            <div className="text-sm font-medium flex items-center gap-2">
                              <span>{paymentSettings?.bank_account_holder || '—'}</span>
                              {paymentSettings?.bank_account_holder && (
                                <button type="button" className="text-xs underline" onClick={() => { navigator.clipboard.writeText(paymentSettings.bank_account_holder!); toast({ title: 'Copied', description: 'Account Holder copied.' }); }}><Copy className="h-3 w-3" /></button>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">Bank & Branch</div>
                            <div className="text-sm font-medium flex items-center gap-2">
                              <span>{paymentSettings?.bank_name_branch || '—'}</span>
                              {paymentSettings?.bank_name_branch && (
                                <button type="button" className="text-xs underline" onClick={() => { navigator.clipboard.writeText(paymentSettings.bank_name_branch!); toast({ title: 'Copied', description: 'Bank & Branch copied.' }); }}><Copy className="h-3 w-3" /></button>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">Account Number</div>
                            <div className="text-sm font-medium flex items-center gap-2">
                              <span>{paymentSettings?.bank_account_number || '—'}</span>
                              {paymentSettings?.bank_account_number && (
                                <button type="button" className="text-xs underline" onClick={() => { navigator.clipboard.writeText(paymentSettings.bank_account_number!); toast({ title: 'Copied', description: 'Account Number copied.' }); }}><Copy className="h-3 w-3" /></button>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">IFSC</div>
                            <div className="text-sm font-medium flex items-center gap-2">
                              <span>{paymentSettings?.bank_ifsc || '—'}</span>
                              {paymentSettings?.bank_ifsc && (
                                <button type="button" className="text-xs underline" onClick={() => { navigator.clipboard.writeText(paymentSettings.bank_ifsc!); toast({ title: 'Copied', description: 'IFSC copied.' }); }}><Copy className="h-3 w-3" /></button>
                              )}
                            </div>
                          </div>
                        </div>
                        {paymentSettings?.instructions && (
                          <div className="mt-2 text-xs text-gray-300">{paymentSettings.instructions}</div>
                        )}
                      </div>
                      {!manualSubmitted ? (
                        <div className="mt-4 space-y-3">
                          <div>
                            <label className="block text-xs mb-1">Payer Name (as per bank)</label>
                            <input className="w-full bg-gray-800 text-white rounded border border-gray-700 px-3 py-2" value={bankPayerName} onChange={e => setBankPayerName(e.target.value)} placeholder="e.g., Jane Doe" />
                          </div>
                          <div>
                            <label className="block text-xs mb-1">UTR / Transaction ID <span className="text-red-400">*</span></label>
                            <input className="w-full bg-gray-800 text-white rounded border border-gray-700 px-3 py-2" value={utrRef} onChange={e => setUtrRef(e.target.value)} placeholder="e.g., HDFC12345678901" />
                            <div className="text-xs text-gray-400 mt-1">Find this in your bank/UPI app after payment. It’s unique to your transfer.</div>
                          </div>
                          {/* UPI ID input removed per spec; verification relies on UTR and optional screenshot */}
                          <div>
                            <label className="block text-xs mb-1">Upload Screenshot (optional)</label>
                            <input type="file" className="w-full bg-gray-800 text-white rounded border border-gray-700 px-3 py-2" onChange={e => setBankScreenshot(e.target.files?.[0] || null)} />
                          </div>
                          <div>
                            <label className="block text-xs mb-1">Note (optional)</label>
                            <input className="w-full bg-gray-800 text-white rounded border border-gray-700 px-3 py-2" value={manualNote} onChange={e => setManualNote(e.target.value)} placeholder="Any notes to help us verify faster" />
                          </div>
                          <div className="p-3 rounded border border-yellow-700 bg-yellow-900/20 text-yellow-100">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 mt-0.5" />
                              <p className="text-xs">Manual verification takes 12–24 hrs after you submit UTR. For instant activation, choose Razorpay.</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 p-3 rounded border border-green-700 bg-green-900/20 text-green-100">
                          <p className="text-sm">Thanks! We’ve received your details. We’ll verify your payment within 12–24 hrs and email confirmation to {email || 'your email'}.</p>
                          <p className="text-xs mt-2">Need help? WhatsApp us: <a className="underline" href="https://wa.me/919999999999" target="_blank">+91 99999 99999</a></p>
                        </div>
                      )}
                    </div>
                </div>

                  {/* Removed "Save this method for future" toggle per spec */}

                  {paymentMethod !== 'razorpay' && (
                    <div className="mt-4">
                      <label className="block text-sm mb-2">Currency (for Stripe / Manual)</label>
                      <div className="flex gap-2 flex-wrap">
                        {currencies.map(c => (
                          <Button
                            key={c.code}
                            variant={selectedCurrency === c.code ? 'default' : 'outline'}
                            onClick={() => setSelectedCurrency(c.code)}
                          >{c.code}</Button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">INR → pay with Razorpay. USD/EUR/GBP → pay with Stripe.</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-4">
                    <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} />
                    <span className="text-sm">I agree to the Terms of Service and Privacy Policy.</span>
                  </div>

                  {paymentMethod === 'manual' && !manualSubmitted && (
                    <div className="flex items-center gap-2 mt-2">
                      <input id="transferDone" type="checkbox" className="scale-110" checked={transferCompleted} onChange={e => setTransferCompleted(e.target.checked)} />
                      <label htmlFor="transferDone" className="text-sm">I have completed the transfer.</label>
                    </div>
                  )}

                  <div className="mt-6">
                    {(paymentMethod !== 'manual' || !manualSubmitted) && (
                      <Button
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                        onClick={startCheckout}
                        disabled={payDisabled}
                      >
                        {ctaText}
                      </Button>
                    )}
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      {paymentMethod === 'razorpay' && 'You’ll be redirected securely to Razorpay to complete payment.'}
                      {paymentMethod === 'stripe' && (selectedCurrency === 'INR' ? 'Use Razorpay for INR.' : 'You’ll be redirected securely to Stripe to complete payment.')}
                      {paymentMethod === 'manual' && !manualSubmitted && 'We’ll verify your payment within 12–24 hrs after you submit UTR.'}
                      {paymentMethod === 'manual' && manualSubmitted && 'Thanks! Your details are submitted for verification.'}
                    </p>
                    {gatewayError && (
                      <div className="mt-3 p-3 rounded border border-red-700 bg-red-900/20 text-red-100 text-center">
                        <div className="text-xs mb-2">{gatewayError}</div>
                        <div className="flex gap-2 justify-center">
                          {!razorpayBlocked && (
                            <Button variant="outline" onClick={() => setPaymentMethod('razorpay')}>Use Razorpay</Button>
                          )}
                          {!stripeBlocked && (
                            <Button variant="outline" onClick={() => setPaymentMethod('stripe')}>Use Stripe</Button>
                          )}
                          <Button variant="outline" onClick={() => setPaymentMethod('manual')}>Use Bank Transfer</Button>
                        </div>
                      </div>
                    )}
                    <div className="mt-2 text-center text-xs">
                      <a href="/refunds" className="text-gray-300 underline mr-3">Refunds & Cancellations</a>
                      <a href="mailto:support@pickntrust.com" className="text-gray-300 underline mr-3">Contact Support (Email)</a>
                      <a href="https://wa.me/919999999999" target="_blank" className="text-gray-300 underline">WhatsApp</a>
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-300">
                      <div className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-green-400" /> SSL Secured</div>
                      <div className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-blue-400" /> PCI-DSS Compliant</div>
                      <div className="flex items-center gap-1"><CreditCard className="h-4 w-4 text-purple-400" /> Trusted Payment Gateway</div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">We never store your payment details.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column: Order Summary */}
            <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-700 shadow-xl ring-1 ring-slate-700 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">3</span>
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-200">
                <div className="flex items-center gap-2 text-gray-300">
                  <Megaphone className="h-4 w-4" />
                  <span className="text-sm">Ad Placement Details</span>
                </div>
                <div className="flex justify-between">
                  <span>Placement</span>
                  <span className="font-medium">{placementName || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration</span>
                  <span className="font-semibold capitalize">{duration}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount</span>
                  <span className="font-semibold">
                    {amountINR != null ? `${formatPrice(amountINR)} (${selectedCurrency})` : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Tax (est.)</span>
                  <span>Included / added as applicable</span>
                </div>
                {nextPaymentDate && (
                  <div className="flex justify-between text-gray-300">
                    <span>Next Payment Date</span>
                    <span className="font-medium">{nextPaymentDate}</span>
                  </div>
                )}
                <div className="text-xs text-gray-400">
                  {paymentMethod === 'manual' ? (
                    <span>Manual renewal; you’ll receive a reminder with bank details before the next date.</span>
                  ) : (
                    <span>Renews automatically; you can cancel anytime from your account.</span>
                  )}
                </div>
                <hr className="border-gray-700" />
                <div className="flex justify-between">
                  <span>Total</span>
                  <span className="font-bold text-white">{amountINR != null ? `${formatPrice(amountINR)} (${selectedCurrency})` : '—'}</span>
                </div>
                <div className="text-xs text-gray-400">UPI/Wallets via Razorpay are billed in INR. You’ll be redirected securely to Razorpay to complete payment.</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {/* Auth Modal Overlay for non-logged in users */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-lg p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-5 w-5 text-green-400" />
              <h2 className="text-xl font-semibold text-white">Login Required</h2>
            </div>
            <p className="text-gray-300 mb-4">Please login or register to continue to payment.</p>
            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => setLocation('/advertise/dashboard')}>Login</Button>
              <Button className="flex-1" variant="outline" onClick={() => setLocation('/advertise/register')}>Register</Button>
            </div>
          </div>
        </div>
      )}
      {/* Post-payment Proof Modal */}
      {/* Proof flow deferred: removed modal */}
    </PageLayout>
  );
}

function StripeInlineForm({ onSuccess }: { onSuccess?: () => void }) {
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const confirmCardPayment = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });
      if (result.error) {
        toast({ title: 'Card error', description: result.error.message || 'Unable to confirm payment', variant: 'destructive' });
      } else {
        const intent = result.paymentIntent;
        if (intent && intent.status === 'succeeded') {
          // Store transaction id for proof linkage; webhook marks completion
          try {
            (window as any).setStripeIntentId = intent.id;
          } catch {}
          onSuccess?.();
        } else if (intent && intent.status === 'requires_action') {
          toast({ title: 'Additional authentication needed', description: 'Please complete the 3D Secure challenge.' });
        } else {
          toast({ title: 'Payment status', description: intent?.status || 'Processing' });
        }
      }
    } catch (e: any) {
      toast({ title: 'Confirm error', description: e.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <PaymentElement />
      <Button onClick={confirmCardPayment} disabled={loading} className="w-full">
        {loading ? 'Confirming…' : 'Confirm Card Payment'}
      </Button>
    </div>
  );
}