// Simple in-memory controller to enable/disable Telegram bot processing at runtime
// Defaults to enabled; can be toggled via admin API without restarting the server

type BotProcessingState = {
  enabled: boolean;
  lastChangedAt?: string;
};

const state: BotProcessingState = {
  enabled: true,
  lastChangedAt: undefined,
};

export const botProcessingController = {
  isEnabled(): boolean {
    return state.enabled === true;
  },
  setEnabled(enabled: boolean): BotProcessingState {
    state.enabled = !!enabled;
    state.lastChangedAt = new Date().toISOString();
    return { ...state };
  },
  getState(): BotProcessingState {
    return { ...state };
  },
};

export default botProcessingController;