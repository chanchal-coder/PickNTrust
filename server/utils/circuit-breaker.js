// Minimal resilient API client with retry and basic circuit-breaking
export class ResilientApiClient {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.backoffMs = options.backoffMs ?? 500;
    this.timeoutMs = options.timeoutMs ?? 10000;
    this.failureThreshold = options.failureThreshold ?? 5;
    this.cooldownMs = options.cooldownMs ?? 30000;
    this.failures = 0;
    this.isOpen = false;
    this.lastOpenedAt = 0;
  }

  async request(url, fetchOptions = {}) {
    if (this.isOpen && Date.now() - this.lastOpenedAt < this.cooldownMs) {
      throw new Error('Circuit breaker open');
    } else if (this.isOpen) {
      // Cooldown elapsed
      this.isOpen = false;
      this.failures = 0;
    }

    let attempt = 0;
    let lastError;

    while (attempt <= this.maxRetries) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        const res = await fetch(url, { ...fetchOptions, signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res;
      } catch (err) {
        lastError = err;
        attempt += 1;
        this.failures += 1;
        if (this.failures >= this.failureThreshold) {
          this.isOpen = true;
          this.lastOpenedAt = Date.now();
        }
        if (attempt > this.maxRetries) break;
        await new Promise(r => setTimeout(r, this.backoffMs * attempt));
      }
    }

    throw lastError ?? new Error('Request failed');
  }
}

export default { ResilientApiClient };