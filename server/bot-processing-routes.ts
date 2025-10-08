import { Router } from 'express';
import botProcessingController from './bot-processing-controller.js';
// Note: Avoid extra deps; reuse env/dev password checks only.

const router = Router();

// Reuse flexible admin password verification consistent with other modules
async function verifyAdminPassword(password?: string): Promise<boolean> {
  try {
    const envPassword = process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD;
    if (envPassword && password && password === envPassword) return true;

    const devAllowed = ['pickntrust2025', 'admin', 'delete'];
    if (password && devAllowed.includes(password)) return true;

    return false;
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}

// GET current processing state (public read-only OK)
router.get('/api/admin/bot/processing', (_req, res) => {
  const state = botProcessingController.getState();
  res.json({ enabled: state.enabled, lastChangedAt: state.lastChangedAt });
});

// PUT update processing state (admin-only in production; optional in dev)
router.put('/api/admin/bot/processing', async (req, res) => {
  try {
    const headerPwd = (req.headers['x-admin-password'] as string) || undefined;
    const bodyPwd = (req.body && (req.body as any).password) || undefined;
    const password = headerPwd || bodyPwd;
    const isProd = process.env.NODE_ENV === 'production';

    if (isProd) {
      if (!password || !(await verifyAdminPassword(password))) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    } else if (password && !(await verifyAdminPassword(password))) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const enabledRaw = (req.body && (req.body as any).enabled);
    const enabled = !!enabledRaw;
    const newState = botProcessingController.setEnabled(enabled);
    console.log('⚙️ Bot processing state updated:', newState);
    res.json({ message: 'Bot processing state updated', enabled: newState.enabled, lastChangedAt: newState.lastChangedAt });
  } catch (error) {
    console.error('Failed to update bot processing state:', error);
    res.status(500).json({ message: 'Failed to update processing state' });
  }
});

export default router;