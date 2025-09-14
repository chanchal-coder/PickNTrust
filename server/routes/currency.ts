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
    return res.json(rates);
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return res.status(500).json({ error: 'Failed to fetch exchange rates' });
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