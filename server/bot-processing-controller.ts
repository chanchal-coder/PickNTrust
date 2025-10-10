// Simple in-memory controller to enable/disable Telegram bot processing at runtime
// Defaults to enabled; can be toggled via admin API without restarting the server

import fs from 'fs';
import path from 'path';

type BotProcessingState = {
  enabled: boolean;
  lastChangedAt?: string;
};

// Persist state across restarts to prevent toggle from resetting
const STATE_DIR = path.join(process.cwd(), '.runtime-state');
const STATE_FILE = path.join(STATE_DIR, 'bot-processing.json');

function loadState(): BotProcessingState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      return {
        enabled: !!data.enabled,
        lastChangedAt: typeof data.lastChangedAt === 'string' ? data.lastChangedAt : undefined,
      };
    }
  } catch (e) {
    console.warn('Failed to load bot processing state, using defaults:', e);
  }
  return { enabled: true, lastChangedAt: undefined };
}

function saveState(s: BotProcessingState) {
  try {
    if (!fs.existsSync(STATE_DIR)) {
      fs.mkdirSync(STATE_DIR, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2));
  } catch (e) {
    console.warn('Failed to persist bot processing state:', e);
  }
}

const state: BotProcessingState = loadState();

export const botProcessingController = {
  isEnabled(): boolean {
    return state.enabled === true;
  },
  setEnabled(enabled: boolean): BotProcessingState {
    state.enabled = !!enabled;
    state.lastChangedAt = new Date().toISOString();
    saveState(state);
    return { ...state };
  },
  getState(): BotProcessingState {
    return { ...state };
  },
};

export default botProcessingController;