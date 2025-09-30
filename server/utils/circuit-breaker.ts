export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  expectedErrors?: string[];
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private successCount: number = 0;
  private options: CircuitBreakerOptions;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      resetTimeout: options.resetTimeout || 60000, // 1 minute
      monitoringPeriod: options.monitoringPeriod || 10000, // 10 seconds
      expectedErrors: options.expectedErrors || ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND']
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitBreakerState.HALF_OPEN;
        console.log('Circuit breaker moving to HALF_OPEN state');
      } else {
        throw new Error('Circuit breaker is OPEN - operation not allowed');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error: any) {
      this.onFailure(error);
      throw error;
    }
  }

  private shouldAttemptReset(): boolean {
    return Date.now() - this.lastFailureTime >= this.options.resetTimeout;
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.state = CircuitBreakerState.CLOSED;
      console.log('Circuit breaker reset to CLOSED state');
    }
    this.successCount++;
  }

  private onFailure(error: any): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    // Only count expected errors towards circuit breaker
    const isExpectedError = this.options.expectedErrors?.some(expectedError => 
      error.code === expectedError || error.message?.includes(expectedError)
    );

    if (isExpectedError && this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
      console.log(`Circuit breaker opened after ${this.failureCount} failures`);
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
    };
  }

  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    console.log('Circuit breaker manually reset');
  }
}

// Retry utility with exponential backoff
export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config: RetryOptions = {
    maxRetries: options.maxRetries || 3,
    baseDelay: options.baseDelay || 1000,
    maxDelay: options.maxDelay || 10000,
    backoffMultiplier: options.backoffMultiplier || 2,
    retryableErrors: options.retryableErrors || ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'SQLITE_BUSY']
  };

  let lastError: any;

  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      if (attempt > config.maxRetries) {
        console.error(`Operation failed after ${config.maxRetries} retries:`, error);
        throw error;
      }

      // Check if error is retryable
      const isRetryable = config.retryableErrors?.some(retryableError => 
        error.code === retryableError || error.message?.includes(retryableError)
      );

      if (!isRetryable) {
        console.error('Non-retryable error encountered:', error);
        throw error;
      }

      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      );

      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Combined circuit breaker and retry wrapper
export class ResilientApiClient {
  private circuitBreaker: CircuitBreaker;

  constructor(circuitBreakerOptions?: Partial<CircuitBreakerOptions>) {
    this.circuitBreaker = new CircuitBreaker(circuitBreakerOptions);
  }

  async execute<T>(
    operation: () => Promise<T>,
    retryOptions?: Partial<RetryOptions>
  ): Promise<T> {
    return this.circuitBreaker.execute(async () => {
      return retryWithBackoff(operation, retryOptions);
    });
  }

  getCircuitBreakerStats() {
    return this.circuitBreaker.getStats();
  }

  resetCircuitBreaker() {
    this.circuitBreaker.reset();
  }
}