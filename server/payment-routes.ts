import express, { Request, Response } from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'database.sqlite');
const sqliteDb = new Database(dbPath);

const router = express.Router();

// Simple admin check aligned with current admin panel flow
function isAdmin(req: Request): boolean {
  const headerPwd = (req.headers['x-admin-password'] || (req.headers as any)['X-Admin-Password']) as string | undefined;
  return headerPwd === 'pickntrust2025';
}

// Ensure payment_settings table exists for admin-configurable UPI and bank details
sqliteDb.exec(`
  CREATE TABLE IF NOT EXISTS payment_settings (
    id INTEGER PRIMARY KEY,
    upi_merchant_vpa TEXT,
    upi_qr_url TEXT,
    bank_account_holder TEXT,
    bank_name_branch TEXT,
    bank_account_number TEXT,
    bank_ifsc TEXT,
    instructions TEXT
  );
`);

// Seed a single row if missing
try {
  const existing = sqliteDb.prepare('SELECT id FROM payment_settings WHERE id = 1').get();
  if (!existing) {
    sqliteDb.prepare(`
      INSERT INTO payment_settings (
        id, upi_merchant_vpa, upi_qr_url, bank_account_holder, bank_name_branch, bank_account_number, bank_ifsc, instructions
      ) VALUES (1, '', '', '', '', '', '', '')
    `).run();
  }
} catch (e) {
  console.error('Failed to seed payment_settings:', e);
}

// Support multiple payment accounts: stripe, razorpay, and bank
sqliteDb.exec(`
  CREATE TABLE IF NOT EXISTS payment_gateway_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gateway TEXT NOT NULL,
    name TEXT,
    publishable_key TEXT,
    secret_key TEXT,
    webhook_secret TEXT,
    bank_account_holder TEXT,
    bank_name_branch TEXT,
    bank_account_number TEXT,
    bank_ifsc TEXT,
    upi_vpa TEXT,
    upi_qr_url TEXT,
    instructions TEXT,
    is_active INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

function getActiveGatewayAccount(gateway: 'stripe' | 'razorpay' | 'bank') {
  return sqliteDb.prepare(
    'SELECT * FROM payment_gateway_accounts WHERE gateway = ? AND is_active = 1 ORDER BY id DESC LIMIT 1'
  ).get(gateway) as any;
}

// Ensure payment_proofs table exists to store payer-provided verification
sqliteDb.exec(`
  CREATE TABLE IF NOT EXISTS payment_proofs (
    id INTEGER PRIMARY KEY,
    payment_id INTEGER,
    transaction_id TEXT,
    proof_ref TEXT,
    screenshot_path TEXT,
    payer_name TEXT,
    payer_bank_branch TEXT,
    payer_account_last4 TEXT,
    payer_ifsc TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Basic pricing fallback if Stripe is not available or for sanity checks
const SERVER_PRICING_USD: Record<string, Partial<Record<'daily'|'weekly'|'monthly'|'yearly', number>>> = {
  'Sidebar Banner': { daily: 20, weekly: 100, monthly: 350, yearly: 3500 },
  'Homepage Hero Banner': { daily: 50, weekly: 250, monthly: 800, yearly: 8000 },
  'Category Top Banner': { daily: 30, weekly: 150, monthly: 500, yearly: 5000 },
  'Footer Banner': { daily: 10, weekly: 50, monthly: 150, yearly: 1500 },
  'Product Page Banner': { daily: 15, weekly: 75, monthly: 250, yearly: 2500 },
  'Sponsored Deals Post': { weekly: 300 },
  'Sponsored Blog Post': { weekly: 300 },
  'Sponsored Video Post': { weekly: 300 },
  'Combo Package': { monthly: 999 },
  'Content Combo (Blog + Video)': { monthly: 499 }
};

// Create advertiser payment record helper
function insertPaymentRecord({
  advertiserId,
  campaignId,
  amount,
  currency,
  method,
  transactionId,
  status
}: {
  advertiserId?: number | null;
  campaignId?: number | null;
  amount: number;
  currency: string;
  method: string;
  transactionId?: string | null;
  status: string;
}) {
  const stmt = sqliteDb.prepare(`
    INSERT INTO advertiser_payments (
      advertiser_id, campaign_id, amount, currency, payment_method, transaction_id, payment_status, payment_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
  `);
  const result = stmt.run(
    advertiserId || null,
    campaignId || null,
    amount,
    currency,
    method,
    transactionId || null,
    status
  );
  return result.lastInsertRowid as number;
}

router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const {
      placementId,
      placementName,
      duration, // 'daily' | 'weekly' | 'monthly' | 'yearly'
      amount,   // integer amount in smallest currency unit or base currency number
      currency = 'USD',
      customerEmail,
      advertiserId,
      preferredMethod, // optional: 'manual' to force manual bank transfer initiation
    } = req.body || {};

    if (!placementName || !duration) {
      return res.status(400).json({ error: 'placementName and duration are required' });
    }

    // Normalize currency
    const normalizedCurrency = String(currency).toLowerCase();

    // Compute a fallback amount if client didn't pass one
    let computedAmountNumber: number | undefined;
    const pricing = SERVER_PRICING_USD[placementName];
    if (pricing && pricing[duration as keyof typeof pricing]) {
      computedAmountNumber = pricing[duration as keyof typeof pricing] as number;
    }

    // If user prefers manual method, skip Stripe and go to manual flow
    if (preferredMethod === 'manual') {
      const finalAmount = typeof amount === 'number' && amount > 0
        ? Number(amount)
        : (() => {
            const pricing = SERVER_PRICING_USD[placementName];
            const computed = pricing && pricing[duration as keyof typeof pricing]
              ? (pricing[duration as keyof typeof pricing] as number)
              : 0;
            return computed;
          })();

      if (finalAmount <= 0) {
        return res.status(400).json({ error: 'Invalid amount for manual payment' });
      }

      const paymentId = insertPaymentRecord({
        advertiserId: advertiserId || null,
        campaignId: null,
        amount: finalAmount,
        currency: normalizedCurrency,
        method: 'manual',
        transactionId: null,
        status: 'pending',
      });

      return res.json({
        message: 'Manual payment initiated. Our team will contact you with bank transfer instructions.',
        paymentId,
      });
    }

    // Try Stripe dynamically; if unavailable, fall back to manual
    let stripeInstance: any = null;
    let stripeSession: any = null;
    let usedAmountMinorUnits: number | undefined;

    try {
      const activeStripe = getActiveGatewayAccount('stripe');
      const stripeKey = activeStripe?.secret_key || process.env.STRIPE_SECRET_KEY;
      if (stripeKey) {
        const stripeModule = await import('stripe');
        const Stripe = stripeModule.default;
        stripeInstance = new Stripe(stripeKey);

        // Prefer client-provided amount if present, otherwise computed USD fallback
        // For Stripe, unit_amount must be in minor units (e.g., cents, paisa)
        if (typeof amount === 'number' && amount > 0) {
          usedAmountMinorUnits = Math.round(Number(amount) * (
            normalizedCurrency === 'inr' ? 100 : 100
          ));
        } else if (typeof computedAmountNumber === 'number' && computedAmountNumber > 0) {
          usedAmountMinorUnits = Math.round(computedAmountNumber * 100);
        } else {
          return res.status(400).json({ error: 'Unable to determine amount for checkout' });
        }

        const isDevelopment = process.env.NODE_ENV !== 'production';
        const FRONTEND_URL = process.env.FRONTEND_URL || (isDevelopment ? 'http://localhost:5173' : '');

        stripeSession = await stripeInstance.checkout.sessions.create({
          mode: 'payment',
          payment_method_types: ['card'],
          success_url: `${FRONTEND_URL}/advertise?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${FRONTEND_URL}/advertise?canceled=true`,
          customer_email: customerEmail || undefined,
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: normalizedCurrency || 'usd',
                product_data: {
                  name: `${placementName} (${duration})`,
                  metadata: {
                    placementId: placementId || '',
                    duration,
                  },
                },
                unit_amount: usedAmountMinorUnits,
              },
            },
          ],
          metadata: {
            placementName,
            duration,
            advertiserId: advertiserId ? String(advertiserId) : '',
          },
        });

        const paymentId = insertPaymentRecord({
          advertiserId: advertiserId || null,
          campaignId: null,
          amount: usedAmountMinorUnits / 100,
          currency: normalizedCurrency,
          method: 'stripe',
          transactionId: stripeSession.id,
          status: 'pending',
        });

        return res.json({ checkoutUrl: stripeSession.url, sessionId: stripeSession.id, paymentId });
      }
    } catch (err) {
      // Fall through to manual if Stripe fails
      console.error('Stripe integration error; falling back to manual:', err);
    }

    // Manual flow fallback
    const finalAmount = typeof amount === 'number' && amount > 0
      ? Number(amount)
      : (typeof computedAmountNumber === 'number' ? computedAmountNumber : 0);

    if (finalAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount for manual payment' });
    }

    const paymentId = insertPaymentRecord({
      advertiserId: advertiserId || null,
      campaignId: null,
      amount: finalAmount,
      currency: normalizedCurrency,
      method: 'manual',
      transactionId: null,
      status: 'pending',
    });

    return res.json({
      message: 'Payment initiated. Our team will contact you to complete the process.',
      paymentId,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to initiate checkout' });
  }
});

// Basic webhook to mark payments completed — signature verification is omitted if JSON parser is used globally
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const event = req.body; // In this setup, express.json has parsed the body
    if (!event || !event.type) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object;
      const transactionId = session?.id;
      const amountTotalMinor = session?.amount_total;
      const currency = session?.currency || 'usd';

      if (transactionId) {
        const stmt = sqliteDb.prepare(`
          UPDATE advertiser_payments
          SET payment_status = 'completed', payment_date = CURRENT_TIMESTAMP, amount = COALESCE(?, amount), currency = ?
          WHERE transaction_id = ?
        `);
        stmt.run(
          typeof amountTotalMinor === 'number' ? amountTotalMinor / 100 : null,
          currency,
          transactionId
        );
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;

// --- Razorpay Integration ---
// --- Stripe Payment Element (PaymentIntent) ---

// Create a PaymentIntent for inline Stripe payments and record a pending payment
router.post('/stripe/create-payment-intent', async (req: Request, res: Response) => {
  try {
    const {
      placementId,
      placementName,
      duration, // 'daily' | 'weekly' | 'monthly' | 'yearly'
      amount,   // base currency amount number
      currency = 'USD',
      customerEmail,
      advertiserId,
    } = req.body || {};

    if (!placementName || !duration) {
      return res.status(400).json({ error: 'placementName and duration are required' });
    }

    const activeStripe = getActiveGatewayAccount('stripe');
    const stripeSecret = activeStripe?.secret_key || process.env.STRIPE_SECRET_KEY;
    const stripePublishable = activeStripe?.publishable_key || process.env.STRIPE_PUBLISHABLE_KEY;
    if (!stripeSecret || !stripePublishable) {
      return res.status(400).json({ error: 'Stripe keys not configured' });
    }

    // Resolve amount
    let resolvedAmountNumber: number | undefined;
    if (typeof amount === 'number' && amount > 0) {
      resolvedAmountNumber = Number(amount);
    } else {
      const pricing = SERVER_PRICING_USD[placementName];
      const fallback = pricing && pricing[duration as keyof typeof pricing]
        ? (pricing[duration as keyof typeof pricing] as number)
        : undefined;
      resolvedAmountNumber = fallback;
    }

    if (!resolvedAmountNumber || resolvedAmountNumber <= 0) {
      return res.status(400).json({ error: 'Unable to determine amount for Stripe PaymentIntent' });
    }

    const stripeModule = await import('stripe');
    const Stripe = stripeModule.default;
    const stripe = new Stripe(stripeSecret);

    const normalizedCurrency = String(currency).toLowerCase() || 'usd';
    const amountMinorUnits = Math.round(resolvedAmountNumber * 100);

    const intent = await stripe.paymentIntents.create({
      amount: amountMinorUnits,
      currency: normalizedCurrency,
      receipt_email: customerEmail || undefined,
      description: `${placementName} (${duration})`,
      metadata: {
        placementId: placementId || '',
        duration,
        advertiserId: advertiserId ? String(advertiserId) : '',
      },
      automatic_payment_methods: { enabled: true },
    });

    // Record pending payment with intent id
    const paymentId = insertPaymentRecord({
      advertiserId: advertiserId || null,
      campaignId: null,
      amount: amountMinorUnits / 100,
      currency: normalizedCurrency,
      method: 'stripe',
      transactionId: intent.id,
      status: 'pending',
    });

    return res.json({ clientSecret: intent.client_secret, publishableKey: stripePublishable, paymentId });
  } catch (error) {
    console.error('Stripe create-payment-intent error:', error);
    res.status(500).json({ error: 'Failed to create PaymentIntent' });
  }
});

// --- Payment Settings API ---
// Get current admin-configured payment details (UPI and bank)
router.get('/settings', (_req: Request, res: Response) => {
  try {
    const row = sqliteDb.prepare(`
      SELECT id,
             COALESCE(upi_merchant_vpa, '') AS upi_merchant_vpa,
             COALESCE(upi_qr_url, '') AS upi_qr_url,
             COALESCE(bank_account_holder, '') AS bank_account_holder,
             COALESCE(bank_name_branch, '') AS bank_name_branch,
             COALESCE(bank_account_number, '') AS bank_account_number,
             COALESCE(bank_ifsc, '') AS bank_ifsc,
             COALESCE(instructions, '') AS instructions
      FROM payment_settings
      WHERE id = 1
    `).get();
    res.json(row || {});
  } catch (error) {
    console.error('Failed to fetch payment settings:', error);
    res.status(500).json({ error: 'Failed to fetch payment settings' });
  }
});

// Update admin-configured payment details
// NOTE: In production, protect this route with authentication/authorization.
router.put('/settings', (req: Request, res: Response) => {
  try {
    const {
      upi_merchant_vpa = '',
      upi_qr_url = '',
      bank_account_holder = '',
      bank_name_branch = '',
      bank_account_number = '',
      bank_ifsc = '',
      instructions = '',
    } = req.body || {};

    const stmt = sqliteDb.prepare(`
      UPDATE payment_settings
      SET upi_merchant_vpa = ?,
          upi_qr_url = ?,
          bank_account_holder = ?,
          bank_name_branch = ?,
          bank_account_number = ?,
          bank_ifsc = ?,
          instructions = ?
      WHERE id = 1
    `);
    stmt.run(
      String(upi_merchant_vpa || ''),
      String(upi_qr_url || ''),
      String(bank_account_holder || ''),
      String(bank_name_branch || ''),
      String(bank_account_number || ''),
      String(bank_ifsc || ''),
      String(instructions || ''),
    );

    const updated = sqliteDb.prepare('SELECT * FROM payment_settings WHERE id = 1').get();
    res.json({ success: true, settings: updated });
  } catch (error) {
    console.error('Failed to update payment settings:', error);
    res.status(500).json({ error: 'Failed to update payment settings' });
  }
});

// Optional config endpoint to fetch publishable key
router.get('/stripe/config', (_req: Request, res: Response) => {
  const activeStripe = getActiveGatewayAccount('stripe');
  const stripePublishable = activeStripe?.publishable_key || process.env.STRIPE_PUBLISHABLE_KEY;
  if (!stripePublishable) {
    return res.status(400).json({ error: 'Stripe publishable key not configured' });
  }
  res.json({ publishableKey: stripePublishable });
});

// Create Razorpay Order and record a pending payment
router.post('/razorpay/create-order', async (req: Request, res: Response) => {
  try {
    const {
      placementId,
      placementName,
      duration,
      amount, // base currency amount (INR recommended)
      currency = 'INR',
      customerEmail,
      advertiserId,
    } = req.body || {};

    if (!placementName || !duration) {
      return res.status(400).json({ error: 'placementName and duration are required' });
    }

    const activeRazorpay = getActiveGatewayAccount('razorpay');
    const keyId = activeRazorpay?.publishable_key || process.env.RAZORPAY_KEY_ID;
    const keySecret = activeRazorpay?.secret_key || process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return res.status(400).json({ error: 'Razorpay keys not configured' });
    }

    // Compute amount minor units (paise)
    let amountMinorUnits: number | undefined;
    if (typeof amount === 'number' && amount > 0) {
      amountMinorUnits = Math.round(Number(amount) * 100);
    } else {
      const pricing = SERVER_PRICING_USD[placementName];
      const fallback = pricing && pricing[duration as keyof typeof pricing]
        ? (pricing[duration as keyof typeof pricing] as number)
        : undefined;
      if (typeof fallback === 'number') {
        // Fallback assumes USD pricing; for demo, convert roughly to INR (x80)
        amountMinorUnits = Math.round(fallback * 80 * 100);
      }
    }

    if (!amountMinorUnits || amountMinorUnits <= 0) {
      return res.status(400).json({ error: 'Unable to determine amount for Razorpay order' });
    }

    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const orderPayload = {
      amount: amountMinorUnits,
      currency: String(currency).toUpperCase() || 'INR',
      receipt: `adv_${Date.now()}`,
      notes: {
        placementId: placementId || '',
        placementName,
        duration,
        advertiserId: advertiserId ? String(advertiserId) : '',
      },
      payment_capture: 1,
    };

    // Node 18+ has global fetch
    const resp = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(orderPayload),
    } as any);

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Razorpay order error:', errText);
      return res.status(500).json({ error: 'Failed to create Razorpay order' });
    }
    const orderData: any = await resp.json();

    // Record pending payment with order id
    const paymentId = insertPaymentRecord({
      advertiserId: advertiserId || null,
      campaignId: null,
      amount: amountMinorUnits / 100,
      currency: String(currency).toLowerCase(),
      method: 'razorpay',
      transactionId: orderData.id,
      status: 'pending',
    });

    const isDevelopment = process.env.NODE_ENV !== 'production';
    const FRONTEND_URL = process.env.FRONTEND_URL || (isDevelopment ? 'http://localhost:5173' : '');

    return res.json({
      orderId: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      keyId,
      paymentId,
      successRedirect: `${FRONTEND_URL}/advertise?success=true`,
      cancelRedirect: `${FRONTEND_URL}/advertise?canceled=true`,
      placementName,
      duration,
    });
  } catch (error) {
    console.error('Razorpay create-order error:', error);
    res.status(500).json({ error: 'Failed to initiate Razorpay checkout' });
  }
});

// Verify Razorpay payment from client and mark payment completed
router.post('/razorpay/verify', async (req: Request, res: Response) => {
  try {
    const { orderId, paymentId, signature } = req.body || {};
    const activeRazorpay = getActiveGatewayAccount('razorpay');
    const keySecret = activeRazorpay?.secret_key || process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(400).json({ error: 'Razorpay key secret not configured' });
    }

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: 'orderId, paymentId and signature are required' });
    }

    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(`${orderId}|${paymentId}`);
    const expected = hmac.digest('hex');

    if (expected !== signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Update advertiser_payments for this orderId
    const updateStmt = sqliteDb.prepare(`
      UPDATE advertiser_payments
      SET payment_status = 'completed', payment_date = CURRENT_TIMESTAMP
      WHERE transaction_id = ?
    `);
    updateStmt.run(orderId);

    // Return the payment row id if available
    const paymentRow = sqliteDb.prepare(`
      SELECT id FROM advertiser_payments WHERE transaction_id = ?
    `).get(orderId) as any;

    return res.json({ verified: true, paymentId: paymentRow?.id || null });
  } catch (error) {
    console.error('Razorpay verify error:', error);
    res.status(500).json({ error: 'Failed to verify Razorpay payment' });
  }
});

// Minimal Razorpay webhook — signature verification optional; updates completed status
router.post('/razorpay/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.header('x-razorpay-signature') || req.header('X-Razorpay-Signature');
    const activeRazorpay = getActiveGatewayAccount('razorpay');
    const webhookSecret = activeRazorpay?.webhook_secret || process.env.RAZORPAY_WEBHOOK_SECRET || '';

    let verified = false;
    if (signature && webhookSecret) {
      try {
        const bodyString = JSON.stringify(req.body);
        const digest = crypto.createHmac('sha256', webhookSecret).update(bodyString).digest('hex');
        verified = digest === signature;
      } catch (e) {
        // ignore verification errors in this minimal setup
        verified = false;
      }
    }

    const event = req.body || {};
    const eventType = event.event || event.type;
    // Supported events: payment.captured, order.paid, payment.failed
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const payload = event.payload || {};
      const paymentEntity = payload.payment?.entity || {};
      const orderEntity = payload.order?.entity || {};
      const transactionId = (orderEntity?.id) || (paymentEntity?.order_id) || null;
      const amountMinor = (paymentEntity?.amount) || (orderEntity?.amount) || null;
      const currency = (paymentEntity?.currency) || (orderEntity?.currency) || 'INR';

      if (transactionId) {
        const stmt = sqliteDb.prepare(`
          UPDATE advertiser_payments
          SET payment_status = 'completed', payment_date = CURRENT_TIMESTAMP, amount = COALESCE(?, amount), currency = ?
          WHERE transaction_id = ?
        `);
        stmt.run(
          typeof amountMinor === 'number' ? amountMinor / 100 : null,
          String(currency).toLowerCase(),
          transactionId
        );
      }
  }

  res.json({ received: true, verified });
} catch (error) {
  console.error('Razorpay webhook error:', error);
  res.status(500).json({ error: 'Razorpay webhook processing failed' });
}
});

// Unified proof submission endpoint for manual, Stripe, and Razorpay
router.post('/proof', async (req: Request, res: Response) => {
  try {
    const {
      paymentId,
      transactionId,
      proofRef,
      screenshotBase64,
      payerName,
      payerBankBranch,
      payerAccountLast4,
      payerIfsc,
      notes,
    } = req.body || {};

    if (!paymentId && !transactionId) {
      return res.status(400).json({ error: 'paymentId or transactionId is required' });
    }

    let screenshotPath: string | null = null;
    if (screenshotBase64 && typeof screenshotBase64 === 'string') {
      try {
        const uploadDir = path.join(__dirname, 'uploads', 'payment-proofs');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const fileName = `proof_${Date.now()}.png`;
        const filePath = path.join(uploadDir, fileName);
        const base64Data = screenshotBase64.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        screenshotPath = filePath;
      } catch (e) {
        console.warn('Failed to store screenshot:', e);
      }
    }

    const insertStmt = sqliteDb.prepare(`
      INSERT INTO payment_proofs (
        payment_id, transaction_id, proof_ref, screenshot_path, payer_name, payer_bank_branch,
        payer_account_last4, payer_ifsc, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = insertStmt.run(
      paymentId || null,
      transactionId || null,
      proofRef || null,
      screenshotPath,
      payerName || null,
      payerBankBranch || null,
      payerAccountLast4 || null,
      payerIfsc || null,
      notes || null
    );

    return res.json({ success: true, proofId: result.lastInsertRowid });
  } catch (error) {
    console.error('Proof submission error:', error);
    res.status(500).json({ error: 'Failed to submit payment proof' });
  }
});

// ---- Admin APIs for Advertiser Payment Summaries ----
// Get latest payment summary for an advertiser with best-effort plan inference
router.get('/admin/advertisers/:id/payments/latest', async (req: Request, res: Response) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
    const advertiserId = Number(req.params.id);
    if (!advertiserId || Number.isNaN(advertiserId)) {
      return res.status(400).json({ error: 'Invalid advertiser id' });
    }

    const payment = sqliteDb.prepare(`
      SELECT id, advertiser_id, campaign_id, amount, currency, payment_method, transaction_id, payment_status, payment_date
      FROM advertiser_payments
      WHERE advertiser_id = ?
      ORDER BY (CASE WHEN payment_date IS NULL THEN 0 ELSE 1 END) DESC, payment_date DESC, id DESC
      LIMIT 1
    `).get(advertiserId) as any;

    if (!payment) {
      return res.json({ payment: null, plan: null });
    }

    let plan: { name?: string; duration?: string } | null = null;

    // Try Stripe enrichment: checkout session or payment intent
    if (String(payment.payment_method).toLowerCase() === 'stripe' && payment.transaction_id) {
      try {
        const activeStripe = getActiveGatewayAccount('stripe');
        const stripeSecret = activeStripe?.secret_key || process.env.STRIPE_SECRET_KEY;
        if (stripeSecret) {
          const stripeModule = await import('stripe');
          const Stripe = stripeModule.default;
          const stripe = new Stripe(stripeSecret);
          const txId: string = String(payment.transaction_id);
          if (txId.startsWith('cs_')) {
            const session = await stripe.checkout.sessions.retrieve(txId, { expand: ['line_items'] });
            const li = (session.line_items && (session.line_items as any).data && (session.line_items as any).data[0]) || null;
            const productName = li?.description || li?.price?.product || null;
            const md = session.metadata || {} as any;
            plan = {
              name: (md.placementName as any) || (typeof productName === 'string' ? productName : undefined),
              duration: (md.duration as any) || undefined,
            };
          } else if (txId.startsWith('pi_')) {
            const intent = await stripe.paymentIntents.retrieve(txId);
            const md = intent.metadata || {} as any;
            plan = {
              name: (md.placementName as any) || (typeof intent.description === 'string' ? intent.description : undefined),
              duration: (md.duration as any) || undefined,
            };
          }
        }
      } catch (e) {
        // Best-effort; ignore enrichment failures
        console.warn('Stripe enrichment failed:', e);
      }
    }

    // Try Razorpay enrichment: order notes
    if (!plan && String(payment.payment_method).toLowerCase() === 'razorpay' && payment.transaction_id) {
      try {
        const activeRazorpay = getActiveGatewayAccount('razorpay');
        const keyId = activeRazorpay?.publishable_key || process.env.RAZORPAY_KEY_ID;
        const keySecret = activeRazorpay?.secret_key || process.env.RAZORPAY_KEY_SECRET;
        if (keyId && keySecret) {
          const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
          const resp = await fetch(`https://api.razorpay.com/v1/orders/${payment.transaction_id}`, {
            method: 'GET',
            headers: { Authorization: authHeader },
          } as any);
          if (resp.ok) {
            const data: any = await resp.json();
            const notes = data?.notes || {};
            plan = {
              name: notes.placementName || undefined,
              duration: notes.duration || undefined,
            };
          }
        }
      } catch (e) {
        console.warn('Razorpay enrichment failed:', e);
      }
    }

    // Try manual proof notes
    if (!plan) {
      try {
        const proof = sqliteDb.prepare(`
          SELECT proof_ref, notes FROM payment_proofs WHERE payment_id = ? ORDER BY created_at DESC LIMIT 1
        `).get(payment.id) as any;
        if (proof && proof.notes) {
          plan = { name: String(proof.notes), duration: undefined };
        }
      } catch {}
    }

    return res.json({ payment, plan });
  } catch (error) {
    console.error('Latest payment summary error:', error);
    res.status(500).json({ error: 'Failed to fetch payment summary' });
  }
});

// ---- Admin APIs for Gateway Accounts ----
// List all gateway accounts
router.get('/gateways', (_req: Request, res: Response) => {
  try {
    const rows = sqliteDb.prepare(`SELECT * FROM payment_gateway_accounts ORDER BY gateway, is_active DESC, created_at DESC`).all();
    res.json({ accounts: rows });
  } catch (error) {
    console.error('Failed to list gateway accounts:', error);
    res.status(500).json({ error: 'Failed to list gateway accounts' });
  }
});

// Create a new gateway account
router.post('/gateways', (req: Request, res: Response) => {
  try {
    const {
      gateway,
      name,
      publishable_key,
      secret_key,
      webhook_secret,
      bank_account_holder,
      bank_name_branch,
      bank_account_number,
      bank_ifsc,
      upi_vpa,
      upi_qr_url,
      instructions,
      is_active = 0,
    } = req.body || {};

    const gw = String(gateway || '').toLowerCase();
    if (!gw || !['stripe', 'razorpay', 'bank'].includes(gw)) {
      return res.status(400).json({ error: 'gateway must be stripe, razorpay or bank' });
    }

    const insert = sqliteDb.prepare(`
      INSERT INTO payment_gateway_accounts (
        gateway, name, publishable_key, secret_key, webhook_secret,
        bank_account_holder, bank_name_branch, bank_account_number, bank_ifsc,
        upi_vpa, upi_qr_url, instructions, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = insert.run(
      gw,
      name || null,
      publishable_key || null,
      secret_key || null,
      webhook_secret || null,
      bank_account_holder || null,
      bank_name_branch || null,
      bank_account_number || null,
      bank_ifsc || null,
      upi_vpa || null,
      upi_qr_url || null,
      instructions || null,
      is_active ? 1 : 0
    );

    const created = sqliteDb.prepare('SELECT * FROM payment_gateway_accounts WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, account: created });
  } catch (error) {
    console.error('Failed to add gateway account:', error);
    res.status(500).json({ error: 'Failed to add gateway account' });
  }
});

// Activate an account for a gateway
router.put('/gateways/:id/activate', (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const account = sqliteDb.prepare('SELECT * FROM payment_gateway_accounts WHERE id = ?').get(id) as any;
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const gateway = String(account.gateway).toLowerCase();
    sqliteDb.prepare('UPDATE payment_gateway_accounts SET is_active = 0 WHERE gateway = ?').run(gateway);
    sqliteDb.prepare('UPDATE payment_gateway_accounts SET is_active = 1 WHERE id = ?').run(id);

    // If bank gateway, sync to payment_settings to keep checkout UI working
    if (gateway === 'bank') {
      sqliteDb.prepare(`
        UPDATE payment_settings SET
          upi_merchant_vpa = COALESCE(?, ''),
          upi_qr_url = COALESCE(?, ''),
          bank_account_holder = COALESCE(?, ''),
          bank_name_branch = COALESCE(?, ''),
          bank_account_number = COALESCE(?, ''),
          bank_ifsc = COALESCE(?, ''),
          instructions = COALESCE(?, '')
        WHERE id = 1
      `).run(
        account.upi_vpa || null,
        account.upi_qr_url || null,
        account.bank_account_holder || null,
        account.bank_name_branch || null,
        account.bank_account_number || null,
        account.bank_ifsc || null,
        account.instructions || null
      );
    }

    const active = getActiveGatewayAccount(gateway as any);
    res.json({ success: true, active });
  } catch (error) {
    console.error('Failed to activate gateway account:', error);
    res.status(500).json({ error: 'Failed to activate gateway account' });
  }
});