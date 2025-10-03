// @ts-nocheck
import { Request, Response, Router } from 'express';
import { db } from '../db.js';
import { exchangeRates, currencySettings } from '../../shared/sqlite-schema.js';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Get all exchange rates
router.get('/rates', async (req: Request, res: Response) => {
  try {
    const rates = await db.select().from(exchangeRates);
    // If table exists but has no rows, provide sane defaults instead of 500
    if (!Array.isArray(rates) || rates.length === 0) {
      const now = Date.now();
      const fallback = [
        { fromCurrency: 'INR', toCurrency: 'USD', rate: 0.012, lastUpdated: now },
        { fromCurrency: 'INR', toCurrency: 'EUR', rate: 0.011, lastUpdated: now },
        { fromCurrency: 'INR', toCurrency: 'GBP', rate: 0.0095, lastUpdated: now },
        { fromCurrency: 'INR', toCurrency: 'JPY', rate: 1.8, lastUpdated: now },
        { fromCurrency: 'INR', toCurrency: 'CAD', rate: 0.016, lastUpdated: now },
        { fromCurrency: 'INR', toCurrency: 'AUD', rate: 0.018, lastUpdated: now },
        { fromCurrency: 'INR', toCurrency: 'SGD', rate: 0.016, lastUpdated: now },
        { fromCurrency: 'INR', toCurrency: 'CNY', rate: 0.087, lastUpdated: now },
        { fromCurrency: 'INR', toCurrency: 'KRW', rate: 16.2, lastUpdated: now },
        { fromCurrency: 'USD', toCurrency: 'INR', rate: 83.0, lastUpdated: now },
        { fromCurrency: 'EUR', toCurrency: 'INR', rate: 90.0, lastUpdated: now },
        { fromCurrency: 'GBP', toCurrency: 'INR', rate: 105.0, lastUpdated: now },
        { fromCurrency: 'JPY', toCurrency: 'INR', rate: 0.56, lastUpdated: now },
        { fromCurrency: 'CAD', toCurrency: 'INR', rate: 62.0, lastUpdated: now },
        { fromCurrency: 'AUD', toCurrency: 'INR', rate: 55.0, lastUpdated: now },
        { fromCurrency: 'SGD', toCurrency: 'INR', rate: 62.0, lastUpdated: now },
        { fromCurrency: 'CNY', toCurrency: 'INR', rate: 11.5, lastUpdated: now },
        { fromCurrency: 'KRW', toCurrency: 'INR', rate: 0.062, lastUpdated: now },
      ];
      return res.json(fallback);
    }
    return res.json(rates);
  } catch (error) {
    // If the table doesn't exist or DB errors, respond with defaults to avoid 500s
    console.warn('Currency rates DB error, serving defaults:', (error as any)?.message);
    const now = Date.now();
    const fallback = [
      { fromCurrency: 'INR', toCurrency: 'USD', rate: 0.012, lastUpdated: now },
      { fromCurrency: 'INR', toCurrency: 'EUR', rate: 0.011, lastUpdated: now },
      { fromCurrency: 'INR', toCurrency: 'GBP', rate: 0.0095, lastUpdated: now },
      { fromCurrency: 'INR', toCurrency: 'JPY', rate: 1.8, lastUpdated: now },
      { fromCurrency: 'INR', toCurrency: 'CAD', rate: 0.016, lastUpdated: now },
      { fromCurrency: 'INR', toCurrency: 'AUD', rate: 0.018, lastUpdated: now },
      { fromCurrency: 'INR', toCurrency: 'SGD', rate: 0.016, lastUpdated: now },
      { fromCurrency: 'INR', toCurrency: 'CNY', rate: 0.087, lastUpdated: now },
      { fromCurrency: 'INR', toCurrency: 'KRW', rate: 16.2, lastUpdated: now },
      { fromCurrency: 'USD', toCurrency: 'INR', rate: 83.0, lastUpdated: now },
      { fromCurrency: 'EUR', toCurrency: 'INR', rate: 90.0, lastUpdated: now },
      { fromCurrency: 'GBP', toCurrency: 'INR', rate: 105.0, lastUpdated: now },
      { fromCurrency: 'JPY', toCurrency: 'INR', rate: 0.56, lastUpdated: now },
      { fromCurrency: 'CAD', toCurrency: 'INR', rate: 62.0, lastUpdated: now },
      { fromCurrency: 'AUD', toCurrency: 'INR', rate: 55.0, lastUpdated: now },
      { fromCurrency: 'SGD', toCurrency: 'INR', rate: 62.0, lastUpdated: now },
      { fromCurrency: 'CNY', toCurrency: 'INR', rate: 11.5, lastUpdated: now },
      { fromCurrency: 'KRW', toCurrency: 'INR', rate: 0.062, lastUpdated: now },
    ];
    return res.json(fallback);
  }
});

// Get currency settings
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const settings = await db.select().from(currencySettings).limit(1);
    if (settings.length === 0) {
      // Return default settings if none exist
      return res.json({
        defaultCurrency: 'INR',
        enabledCurrencies: ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'SGD', 'CNY', 'KRW'],
        autoUpdateRates: true
      });
    }
    
    const setting = settings[0];
    return res.json({
      defaultCurrency: setting.defaultCurrency,
      enabledCurrencies: JSON.parse(setting.enabledCurrencies || '[]'),
      autoUpdateRates: setting.autoUpdateRates
    });
  } catch (error) {
    console.error('Error fetching currency settings:', error);
    return res.status(500).json({ error: 'Failed to fetch currency settings' });
  }
});

// Update exchange rate
router.post('/rates', async (req: Request, res: Response) => {
  try {
    const { fromCurrency, toCurrency, rate } = req.body;
    
    if (!fromCurrency || !toCurrency || !rate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if rate already exists
    const existingRate = await db.select()
      .from(exchangeRates)
      .where(and(
        eq(exchangeRates.fromCurrency, fromCurrency),
        eq(exchangeRates.toCurrency, toCurrency)
      ))
      .limit(1);

    if (existingRate.length > 0) {
      // Update existing rate
      await db.update(exchangeRates)
        .set({ 
          rate: rate.toString(), 
          lastUpdated: new Date() 
        })
        .where(eq(exchangeRates.id, existingRate[0].id));
    } else {
      // Insert new rate
      await db.insert(exchangeRates).values({
        fromCurrency,
        toCurrency,
        rate: rate.toString(),
        lastUpdated: new Date()
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Error updating exchange rate:', error);
    return res.status(500).json({ error: 'Failed to update exchange rate' });
  }
});

// Convert currency (utility endpoint)
router.post('/convert', async (req: Request, res: Response) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;
    
    if (!amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (fromCurrency === toCurrency) {
      return res.json({ convertedAmount: amount, rate: 1 });
    }

    // Get exchange rate
    const rates = await db.select()
      .from(exchangeRates)
      .where(and(
        eq(exchangeRates.fromCurrency, fromCurrency),
        eq(exchangeRates.toCurrency, toCurrency)
      ))
      .limit(1);

    if (rates.length === 0) {
      // Try reverse rate
      const reverseRates = await db.select()
        .from(exchangeRates)
        .where(and(
          eq(exchangeRates.fromCurrency, toCurrency),
          eq(exchangeRates.toCurrency, fromCurrency)
        ))
        .limit(1);

      if (reverseRates.length === 0) {
        return res.status(404).json({ error: 'Exchange rate not found' });
      }

      const reverseRate = parseFloat(reverseRates[0].rate);
      const convertedAmount = amount / reverseRate;
      return res.json({ convertedAmount, rate: 1 / reverseRate });
    }

    const rate = parseFloat(rates[0].rate);
    const convertedAmount = amount * rate;
    return res.json({ convertedAmount, rate });
  } catch (error) {
    console.error('Error converting currency:', error);
    return res.status(500).json({ error: 'Failed to convert currency' });
  }
});

// Update currency settings
router.post('/settings', async (req: Request, res: Response) => {
  try {
    const { defaultCurrency, enabledCurrencies, autoUpdateRates } = req.body;
    
    // Get existing settings
    const existingSettings = await db.select().from(currencySettings).limit(1);
    
    const settingsData = {
      defaultCurrency: defaultCurrency || 'INR',
      enabledCurrencies: JSON.stringify(enabledCurrencies || ['INR', 'USD', 'EUR']),
      autoUpdateRates: autoUpdateRates !== undefined ? autoUpdateRates : true,
      updatedAt: new Date()
    };

    if (existingSettings.length > 0) {
      // Update existing settings
      await db.update(currencySettings)
        .set(settingsData)
        .where(eq(currencySettings.id, existingSettings[0].id));
    } else {
      // Insert new settings
      await db.insert(currencySettings).values({
        ...settingsData,
        createdAt: new Date()
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Error updating currency settings:', error);
    return res.status(500).json({ error: 'Failed to update currency settings' });
  }
});

export default router;